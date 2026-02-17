import { CallbackContext, WizardScene } from "../types/index.js";
import { Tariff, ZoneParams, MeterType } from "../models/index.js";
import { InlineKeyboard } from "grammy";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

const createTariffScene: WizardScene<CallbackContext> = {
	name: "create-tariff",
	steps: [
		// Шаг 0: выбор типа тарифа
		async (ctx) => {
			await ctx.callbackQuery?.message?.editText("Выберите тип тарифа:", {
				reply_markup: new InlineKeyboard()
					.text("Однотарифный", MeterType.SINGLE).row()
					.text("День/Ночь", MeterType.DAY_NIGHT).row()
					.text("Пик/Полупик/Ночь", MeterType.MULTI_ZONE).row()
					.text("Отмена", "cancel"),
			});
			return ctx.wizard.next();
		},

		// Шаг 1: обработка выбора типа
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.callbackQuery.message?.delete();
				return ctx.scene.leave();
			}

			const type = ctx.update.callback_query?.data;
			ctx.wizard.state.type = type;
			ctx.wizard.state.accountId = ctx.wizard.params.accountId;

			if (type === MeterType.SINGLE) {
				await ctx.callbackQuery?.message?.editText("Введите цену (₴/кВт·ч):", { reply_markup: cancelBtn });
			} else if (type === MeterType.DAY_NIGHT) {
				await ctx.callbackQuery?.message?.editText("Введите цену для Дня (₴/кВт·ч):", { reply_markup: cancelBtn });
			} else if (type === MeterType.MULTI_ZONE) {
				await ctx.callbackQuery?.message?.editText("Введите цену для Пика (₴/кВт·ч):", { reply_markup: cancelBtn });
			}

			ctx.wizard.state.message = ctx.callbackQuery?.message;
			return ctx.wizard.next();
		},

		// Шаг 2: ввод первой цены
		async (ctx) => {
			const price = parseFloat(ctx.msg?.text || "");
			if (isNaN(price)) {
				await ctx.wizard.state.message?.editText("❌ Введите число.", { reply_markup: cancelBtn });
				return ctx.wizard.back();
			}

			const type = ctx.wizard.state.type;
			await ctx.msg?.delete();

			if (type === MeterType.SINGLE) {
				ctx.wizard.state.zones = [{ name: "standard", price }];
				return saveTariff(ctx);
			}

			if (type === MeterType.DAY_NIGHT) {
				ctx.wizard.state.zones = [{ name: "day", price }];
				await ctx.wizard.state.message?.editText("Введите цену для Ночи (₴/кВт·ч):", { reply_markup: cancelBtn });
				return ctx.wizard.next();
			}

			if (type === MeterType.MULTI_ZONE) {
				ctx.wizard.state.zones = [{ name: "peak", price }];
				await ctx.wizard.state.message?.editText("Введите цену для Полупика (₴/кВт·ч):", { reply_markup: cancelBtn });
				return ctx.wizard.next();
			}
		},

		// Шаг 3: ввод второй цены
		async (ctx) => {
			const price = parseFloat(ctx.msg?.text || "");
			if (isNaN(price)) {
				await ctx.wizard.state.message?.editText("❌ Введите число.", { reply_markup: cancelBtn });
				return ctx.wizard.back();
			}

			const type = ctx.wizard.state.type;
			await ctx.msg?.delete();

			if (type === MeterType.DAY_NIGHT) {
				ctx.wizard.state.zones.push({ name: "night", price });
				return saveTariff(ctx);
			}

			if (type === MeterType.MULTI_ZONE) {
				ctx.wizard.state.zones.push({ name: "half-peak", price });
				await ctx.wizard.state.message?.editText("Введите цену для Ночи (₴/кВт·ч):", { reply_markup: cancelBtn });
				return ctx.wizard.next();
			}
		},

		// Шаг 4: ввод третьей цены (multi-zone)
		async (ctx) => {
			const price = parseFloat(ctx.msg?.text || "");
			if (isNaN(price)) {
				await ctx.wizard.state.message?.editText("❌ Введите число.", { reply_markup: cancelBtn });
				return ctx.wizard.back();
			}

			await ctx.msg?.delete();
			ctx.wizard.state.zones.push({ name: "night", price });
			return saveTariff(ctx);
		},
	],
};

// Функция сохранения тарифа
async function saveTariff(ctx: CallbackContext) {
	try {
		await Tariff.create({
			account_id: ctx.wizard.state.accountId,
			type: ctx.wizard.state.type,
			zones: ctx.wizard.state.zones,
			startDate: new Date(),
		});

		await ctx.wizard.state.message?.editText(
			`✅ Тариф добавлен:\n${ctx.wizard.state.zones.map((z: ZoneParams) => `${z.name}: ${z.price}₴`).join("\n")}`
		);

		// возврат в меню тарифов
		await ctx.services.menuHandler.showMenu(ctx, `tariffs-${ctx.wizard.state.accountId}`);
	} catch (error) {
		console.error(error);
		await ctx.wizard.state.message?.editText("❌ Ошибка при сохранении тарифа.");
	}
	return ctx.scene.leave();
}

export default createTariffScene