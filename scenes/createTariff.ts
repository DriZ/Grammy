import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { Account, Tariff, type ZoneParams, MeterType } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

export default class CreateTariffScene extends BaseScene {
	constructor(client: BotClient) {
		super(client, "create-tariff");
	}

	get steps(): TStepHandler[] {
		return [
			this.askDate,
			this.handleDateAndAskFirstPrice,
			this.handleFirstPrice,
			this.handleSecondPrice,
			this.handleThirdPrice,
		];
	}

	// Шаг 0: Выбор даты (год/месяц)
	private askDate = async (ctx: CallbackContext) => {
		const accountId = ctx.wizard.state.accountId;
		if (!accountId) {
			await this.abort(ctx, "❌ Ошибка: не указан ID счета.");
			return;
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
	};

	// Шаг 1: Обработка даты и запрос первой цены
	private handleDateAndAskFirstPrice = async (ctx: CallbackContext) => {
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
				await this.abort(ctx, "❌ Ошибка: счет не найден.");
				return;
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
	};

	// Шаг 2: ввод первой цены
	private handleFirstPrice = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Создание отменено.", `tariffs-${ctx.wizard.state.accountId}`)) return;

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
			return this.saveTariff(ctx);
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
	};

	// Шаг 3: ввод второй цены
	private handleSecondPrice = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Создание отменено.", `tariffs-${ctx.wizard.state.accountId}`)) return;

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
			return this.saveTariff(ctx);
		}

		if (type === MeterType.MULTI_ZONE) {
			ctx.wizard.state.zones.push({ name: "half-peak", price });
			await ctx.wizard.state.message?.editText("Введите цену для Ночи (₴/кВт·ч):", {
				reply_markup: cancelBtn,
			});
			return ctx.wizard.next();
		}
	};

	// Шаг 4: ввод третьей цены (multi-zone)
	private handleThirdPrice = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Создание отменено.", `tariffs-${ctx.wizard.state.accountId}`)) return;

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
		return this.saveTariff(ctx);
	};

	// Функция сохранения тарифа
	private saveTariff = async (ctx: CallbackContext) => {
		try {
			await Tariff.create({
				account_id: ctx.wizard.state.accountId,
				type: ctx.wizard.state.type,
				zones: ctx.wizard.state.zones,
				startDate: ctx.wizard.state.startDate,
			});

			if (ctx.update.message) await ctx.update.message.delete().catch(() => { });
			else if (ctx.msg) await ctx.msg.delete().catch(() => { });

			const title = `✅ Тариф добавлен:\n${ctx.wizard.state.zones.map((z: ZoneParams) => `${z.name}: ${z.price.toLocaleString("uk-UA", { currencyDisplay: "symbol", style: "currency", currency: "UAH", minimumFractionDigits: 2 })}`).join("\n")}`;
			return this.abort(ctx, title, `tariffs-${ctx.wizard.state.accountId}`);

		} catch (error) {
			return this.handleError(ctx, error, "❌ Ошибка при сохранении тарифа.", `tariffs-${ctx.wizard.state.accountId}`);
		}
	};
}
