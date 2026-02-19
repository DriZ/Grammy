import { CallbackContext, WizardScene } from "../types/index.js";
import { Account, Tariff, ZoneParams, MeterType } from "../models/index.js";
import { InlineKeyboard } from "grammy";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

const createTariffScene: WizardScene<CallbackContext> = {
	name: "create-tariff",
	steps: [
		// Шаг 0: Выбор даты (год/месяц)
		async (ctx) => {
			const accountId = ctx.wizard.state.accountId;
			if (!accountId) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не указан ID счета.");
				return ctx.scene.leave();
			}

			ctx.wizard.state.message = ctx.callbackQuery?.message;
			const currentYear = new Date().getFullYear();
			ctx.wizard.state.selectedYear = currentYear;

			await ctx.wizard.state.message?.editText(
				`📅 Выберите месяц начала действия тарифа (${currentYear}):`,
				{
					reply_markup: ctx.utils.makeYearMonthKeyboard(currentYear),
				},
			);
			return ctx.wizard.next();
		},

		// Шаг 1: Обработка даты и запрос первой цены
		async (ctx) => {
			// Навигация по годам
			const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
			if (yearData) {
				ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
				await ctx.callbackQuery?.message?.editText(
					`📅 Выберите месяц начала действия тарифа (${ctx.wizard.state.selectedYear}):`,
					{
						reply_markup: ctx.utils.makeYearMonthKeyboard(
							ctx.wizard.state.selectedYear,
						),
					},
				);
				return; // Остаемся на этом шаге
			}

			// Выбор месяца
			const monthData = ctx.callbackQuery?.data?.match(/^select-month-(\d{4})-(\d{1,2})$/);
			if (monthData) {
				const year = parseInt(monthData[1], 10);
				const month = parseInt(monthData[2], 10);

				// Устанавливаем дату начала (1 число выбранного месяца)
				ctx.wizard.state.startDate = new Date(year, month - 1, 1);

				const accountId = ctx.wizard.state.accountId;
				const account = await Account.findById(accountId);
				if (!account) {
					await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: счет не найден.");
					return ctx.scene.leave();
				}

				// Определяем тип счетчика
				const type = account.meterType || MeterType.SINGLE;

				ctx.wizard.state.type = type;
				ctx.wizard.state.zones = [];

				const prompt = type === MeterType.SINGLE
					? "Введите цену (₴):"
					: type === MeterType.DAY_NIGHT
						? "Введите цену для Дня (₴/кВт·ч):"
						: type === MeterType.MULTI_ZONE
							? "Введите цену для Пика (₴/кВт·ч):"
							: "Ошибка определения типа счетчика.";

				await ctx.callbackQuery?.message?.editText(prompt, { reply_markup: cancelBtn });
				return ctx.wizard.next();
			}
		},

		// Шаг 2: ввод первой цены
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.cancelCreating(ctx, `account-${ctx.wizard.state.accountId}`);
				return ctx.scene.leave();
			}

			if (!ctx.msg?.text) {
				if (ctx.msg) await ctx.msg.delete();
				await ctx.wizard.state.message?.editText("❌ Введите корректное число.", {
					reply_markup: cancelBtn,
				});
				return;
			}

			const price = parseFloat(ctx.msg?.text.replace(",", "."));
			if (isNaN(price) || price < 0) {
				if (ctx.msg) await ctx.msg.delete();
				await ctx.wizard.state.message?.editText("❌ Введите корректное число.", {
					reply_markup: cancelBtn,
				});
				return;
			}

			await ctx.msg?.delete();
			const type = ctx.wizard.state.type;

			if (type === MeterType.SINGLE) {
				ctx.wizard.state.zones = [{ name: "standard", price }];
				return saveTariff(ctx);
			}

			if (type === MeterType.DAY_NIGHT) {
				ctx.wizard.state.zones = [{ name: "day", price }];
				await ctx.wizard.state.message?.editText("Введите цену для Ночи (₴/кВт·ч):", {
					reply_markup: cancelBtn,
				});
				return ctx.wizard.next();
			}

			if (type === MeterType.MULTI_ZONE) {
				ctx.wizard.state.zones = [{ name: "peak", price }];
				await ctx.wizard.state.message?.editText("Введите цену для Полупика (₴/кВт·ч):", {
					reply_markup: cancelBtn,
				});
				return ctx.wizard.next();
			}
		},

		// Шаг 3: ввод второй цены
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.cancelCreating(ctx, `account-${ctx.wizard.state.accountId}`);
				return ctx.scene.leave();
			}

			const price = parseFloat(ctx.msg?.text?.replace(",", ".") || "");
			if (isNaN(price) || price < 0) {
				if (ctx.msg) await ctx.msg.delete();
				await ctx.wizard.state.message?.editText("❌ Введите корректное число.", {
					reply_markup: cancelBtn,
				});
				return;
			}

			await ctx.msg?.delete();
			const type = ctx.wizard.state.type;

			if (type === MeterType.DAY_NIGHT) {
				ctx.wizard.state.zones.push({ name: "night", price });
				return saveTariff(ctx);
			}

			if (type === MeterType.MULTI_ZONE) {
				ctx.wizard.state.zones.push({ name: "half-peak", price });
				await ctx.wizard.state.message?.editText("Введите цену для Ночи (₴/кВт·ч):", {
					reply_markup: cancelBtn,
				});
				return ctx.wizard.next();
			}
		},

		// Шаг 4: ввод третьей цены (multi-zone)
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.cancelCreating(ctx, `account-${ctx.wizard.state.accountId}`);
				return ctx.scene.leave();
			}

			const price = parseFloat(ctx.msg?.text?.replace(",", ".") || "");
			if (isNaN(price) || price < 0) {
				if (ctx.msg) await ctx.msg.delete();
				await ctx.wizard.state.message?.editText("❌ Введите корректное число.", {
					reply_markup: cancelBtn,
				});
				return;
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
			startDate: ctx.wizard.state.startDate,
		});

		if (ctx.update.message) await ctx.update.message.delete().catch(() => { });
		else if (ctx.msg) await ctx.msg.delete().catch(() => { });

		await ctx.wizard.state.message?.editText(
			`✅ Тариф добавлен:\n${ctx.wizard.state.zones.map((z: ZoneParams) => `${z.name}: ${z.price}₴`).join("\n")}`, {
			reply_markup: new InlineKeyboard().text("⬅️ Назад", `account-${ctx.wizard.state.accountId}`)
		}
		);

	} catch (error) {
		console.error(error);
		await ctx.wizard.state.message?.editText("❌ Ошибка при сохранении тарифа.");
	}
	return ctx.scene.leave();
}

export default createTariffScene;
