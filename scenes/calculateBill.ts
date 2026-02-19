import { CallbackContext, WizardScene } from "../types/index.js";
import { UtilitiesReading, Tariff } from "../models/index.js";
import { InlineKeyboard } from "grammy";

const calculateBillScene: WizardScene<CallbackContext> = {
	name: "calculate-bill",
	steps: [
		// Шаг 0: Показать выбор года/месяца
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
				`📅 Выберите месяц для расчета (${currentYear}):`,
				{
					reply_markup: ctx.utils.makeYearMonthKeyboard(currentYear),
				},
			);
			return ctx.wizard.next();
		},

		// Шаг 1: Обработать выбор и рассчитать
		async (ctx) => {
			// Навигация по годам
			const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
			if (yearData) {
				ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
				await ctx.callbackQuery?.message?.editText(
					`📅 Выберите месяц для расчета (${ctx.wizard.state.selectedYear}):`,
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

			const year = parseInt(monthData[1], 10);
			const month = parseInt(monthData[2], 10);
			const accountId = ctx.wizard.state.accountId;

			// 1. Получаем текущие показания
			const currentReading = await UtilitiesReading.findOne({ account_id: accountId, year, month });
			if (!currentReading) {
				await ctx.scene.backToMenu(ctx, `❌ Показания за ${month}.${year} не найдены.`, `account-${accountId}`);
				return ctx.scene.leave();
			}

			// 2. Получаем предыдущие показания
			const prevMonthDate = new Date(year, month - 1, 1);
			prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
			const prevYear = prevMonthDate.getFullYear();
			const prevMonth = prevMonthDate.getMonth() + 1;

			const previousReading = await UtilitiesReading.findOne({ account_id: accountId, year: prevYear, month: prevMonth });
			if (!previousReading) {
				await ctx.scene.backToMenu(ctx, `❌ Показания за предыдущий месяц (${prevMonth}.${prevYear}) не найдены для расчета разницы.`, `account-${accountId}`);
				return ctx.scene.leave();
			}

			// 3. Получаем актуальный тариф
			const readingDate = new Date(year, month - 1, 1);
			const tariff = await Tariff.findOne({
				account_id: accountId,
				startDate: { $lte: readingDate },
			}).sort({ startDate: -1 });

			if (!tariff) {
				await ctx.scene.backToMenu(ctx, `❌ Не найден действующий тариф на ${month}.${year}.`, `account-${accountId}`);
				return ctx.scene.leave();
			}

			// 4. Рассчитываем и форматируем результат
			let totalCost = 0;
			const resultLines: string[] = [];
			resultLines.push(`🧾 Расчет за **${month.toString().padStart(2, "0")}.${year}**`);
			resultLines.push("---");

			for (const currentZone of currentReading.zones) {
				const prevZone = previousReading.zones.find((z) => z.name === currentZone.name);
				const tariffZone = tariff.zones.find((z) => z.name === currentZone.name);

				if (!prevZone || !tariffZone) continue;

				const consumption = currentZone.value - prevZone.value;
				if (consumption < 0) {
					await ctx.scene.backToMenu(ctx, `❌ Ошибка: отрицательное потребление для зоны "${currentZone.name}".`, `account-${accountId}`);
					return ctx.scene.leave();
				}
				const cost = consumption * tariffZone.price;
				totalCost += cost;

				resultLines.push(`**Зона "${currentZone.name}"**:`);
				resultLines.push(`  - Показания: ${prevZone.value} → ${currentZone.value}`);
				resultLines.push(`  - Потребление: ${consumption}`);
				resultLines.push(`  - Тариф: ${tariffZone.price.toLocaleString("ru-RU", { style: "currency", currency: "UAH" })}`);
				resultLines.push(`  - Сумма: **${cost.toLocaleString("ru-RU", { style: "currency", currency: "UAH" })}**`);
			}

			resultLines.push("---");
			resultLines.push(`**ИТОГО К ОПЛАТЕ: ${totalCost.toLocaleString("ru-RU", { style: "currency", currency: "UAH" })}**`);

			await ctx.wizard.state.message?.editText(resultLines.join("\n"), {
				parse_mode: "Markdown",
				reply_markup: new InlineKeyboard().text("⬅️ Назад", `account-${accountId}`),
			});

			return ctx.scene.leave();
		},
	],
};

export default calculateBillScene;
