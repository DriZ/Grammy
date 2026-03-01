import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { Account, UtilitiesReading, MeterType, type IUtilitiesReading } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

export default class CreateReadingScene extends BaseScene {
	constructor(client: BotClient) {
		super(client, "create-reading");
	}

	get steps(): TStepHandler[] {
		return [
			this.askYear,
			this.handleDateSelection,
			this.handleZoneValue,
			this.handlePostSave
		];
	}

	// Шаг 0: Показать выбор года/месяца
	private askYear = async (ctx: CallbackContext) => {
		if (!ctx.wizard.state.accountId) {
			await this.abort(ctx, "❌ Ошибка: не указан ID счета.");
			return;
		}
		ctx.wizard.state.message = ctx.callbackQuery?.message;
		const currentYear = new Date().getFullYear();
		ctx.wizard.state.selectedYear = currentYear;
		await ctx.wizard.state.message?.editText(`📅 Выберите месяц для ввода показаний (${currentYear}):`, {
      reply_markup: ctx.utils.makeYearMonthKeyboard(currentYear),
    });
		return ctx.wizard.next();
	};

	// Шаг 1: Обработать выбор даты, найти предыдущие показания и запросить первую зону
	private handleDateSelection = async (ctx: CallbackContext) => {
		// Навигация по годам
		const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
		if (yearData) {
			ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
			await ctx.wizard.state.message?.editText(
				`📅 Выберите месяц для ввода показаний (${ctx.wizard.state.selectedYear}):`,
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
		if (!monthData) return;

		await ctx.answerCallbackQuery().catch(() => { });

		const year = parseInt(monthData[1], 10);
		const month = parseInt(monthData[2], 10);
		const accountId = ctx.wizard.state.accountId;

		const reading = await UtilitiesReading.find({ account_id: accountId, month, year });
		if (reading.length > 0) {
			await ctx.callbackQuery.message?.editText(`❌ Показания за ${month}.${year} уже введены.`, {
				reply_markup: new InlineKeyboard()
					.text("➕ Добавить еще", "add_more")
					.row()
					.text("⬅️ Назад", `readings-${ctx.wizard.state.accountId}`)
			});
			return ctx.wizard.selectStep(ctx, 3);
		}

		ctx.wizard.state.year = year;
		ctx.wizard.state.month = month;
		ctx.wizard.state.accountId = accountId;
		ctx.wizard.state.zones = [];

		const account = await Account.findById(accountId);
		if (!account) {
			await this.abort(ctx, "❌ Ошибка: не удалось найти счет в БД.");
			return;
		}

		// Ищем показания за предыдущий месяц
		const prevMonthDate = new Date(year, month - 1, 1);
		prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
		const prevYear = prevMonthDate.getFullYear();
		const prevMonth = prevMonthDate.getMonth() + 1;

		const previousReading = await UtilitiesReading.findOne({ account_id: accountId, year: prevYear, month: prevMonth });
		ctx.wizard.state.previousReading = previousReading;

		const type = account.meterType || MeterType.SINGLE;
		ctx.wizard.state.type = type;

		const zonesToAsk = type === MeterType.SINGLE ? ["standard"] : type === MeterType.DAY_NIGHT ? ["day", "night"] : ["peak", "half-peak", "night"];
		ctx.wizard.state.zonesToAsk = zonesToAsk;
		ctx.wizard.state.currentZoneIndex = 0;

		return this.askForZoneValue(ctx);
	};

	// Шаг 2: Получение и валидация значений для всех зон
	private handleZoneValue = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Создание отменено.", `readings-${ctx.wizard.state.accountId}`)) return;

		// Если пришел callback, но это не отмена, игнорируем его. Ждем текстовое сообщение.
		if (ctx.callbackQuery) {
			await ctx.answerCallbackQuery();
			return;
		}

		const value = parseFloat(ctx.msg?.text?.replace(",", ".") || "");
		const currentZoneName = ctx.wizard.state.zonesToAsk[ctx.wizard.state.currentZoneIndex];
		const previousReading: IUtilitiesReading | null = ctx.wizard.state.previousReading;
		const prevZone = previousReading?.zones.find(z => z.name === currentZoneName);
		const prevValue = prevZone?.value ?? 0;

		if (isNaN(value) || value < prevValue) {
			if (ctx.msg) await ctx.msg.delete();
			await ctx.wizard.state.message?.editText(`❌ Введите число больше или равное предыдущему показанию (${prevValue}).`, {
				reply_markup: cancelBtn,
			});
			return; // Остаемся на этом шаге, ждем корректного ввода
		}

		await ctx.msg?.delete();
		ctx.wizard.state.zones.push({ name: currentZoneName, value });
		ctx.wizard.state.currentZoneIndex++;

		// Если есть еще зоны, спрашиваем следующую
		if (ctx.wizard.state.currentZoneIndex < ctx.wizard.state.zonesToAsk.length) {
			return this.askForZoneValue(ctx);
		} else {
			// Все зоны введены, сохраняем
			return this.saveReading(ctx);
		}
	};

	// Шаг 3: Выбор после сохранения (Добавить еще или Выход)
	private handlePostSave = async (ctx: CallbackContext) => {
		if (ctx.callbackQuery?.data === "add_more" || ctx.update.callback_query?.data === "add_more") {
			await ctx.answerCallbackQuery();
			return ctx.wizard.selectStep(ctx, 0);
		}

		// Если нажали "Назад" или что-то другое
		const backMenu = `readings-${ctx.wizard.state.accountId}`;
		if (ctx.callbackQuery?.data === backMenu) {
			await ctx.answerCallbackQuery();
			await ctx.scene.leave();
			return ctx.services.menuManager.showMenu(ctx, backMenu);
		}
		return;
	};

	private askForZoneValue = async (ctx: CallbackContext) => {
		const currentZoneName = ctx.wizard.state.zonesToAsk[ctx.wizard.state.currentZoneIndex];
		const previousReading: IUtilitiesReading | null = ctx.wizard.state.previousReading;
		const prevZone = previousReading?.zones.find(z => z.name === currentZoneName);
		const prevValue = prevZone?.value ?? 0;

		const prompt = `Введите показания для зоны "${currentZoneName}" (предыдущее: ${prevValue}):`;

		await ctx.wizard.state.message?.editText(prompt, { reply_markup: cancelBtn });

		// Переходим на шаг 2 для обработки ввода
		return ctx.wizard.selectStep(ctx, 2);
	};

	private saveReading = async (ctx: CallbackContext) => {
		try {
			await UtilitiesReading.create({
				account_id: ctx.wizard.state.accountId,
				year: ctx.wizard.state.year,
				month: ctx.wizard.state.month,
				zones: ctx.wizard.state.zones,
			});

			let resultMessage = "✅ Показания сохранены.\n\n";
			const previousReading: IUtilitiesReading | null = ctx.wizard.state.previousReading;

			// Рассчитываем и добавляем потребление, если есть предыдущие показания
			if (previousReading) {
				const consumptionLines: string[] = [];
				for (const currentZone of ctx.wizard.state.zones) {
					const prevZone = previousReading.zones.find(z => z.name === currentZone.name);
					if (prevZone) {
						const consumption = currentZone.value - prevZone.value;
						consumptionLines.push(`- Зона "${currentZone.name}": ${consumption}`);
					}
				}
				if (consumptionLines.length > 0) {
					resultMessage += "Потребление:\n" + consumptionLines.join("\n");
				}
			}

			const keyboard = new InlineKeyboard()
				.text("➕ Добавить еще", "add_more").success().row()
				.text("⬅️ Назад", `readings-${ctx.wizard.state.accountId}`);

			await ctx.wizard.state.message?.editText(resultMessage, {
				reply_markup: keyboard,
			});

		} catch (error) {
			console.error(error);
			await ctx.wizard.state.message?.editText("❌ Ошибка при сохранении показаний.");
		}
		// Не выходим из сцены, а идем на Шаг 3, чтобы ждать выбора пользователя
		return ctx.wizard.next();
	};
}
