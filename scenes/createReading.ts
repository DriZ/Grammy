import { CallbackContext, WizardScene } from "../types/index.js";
import { Account, UtilitiesReading, ZoneReading, MeterType, IAccount } from "../models/index.js";
import { InlineKeyboard } from "grammy";


const createReadingScene: WizardScene<CallbackContext> = {
	name: "create-reading",
	steps: [
		// Шаг 1: выбор года/месяца 
		async (ctx) => {
			const account = await Account.findById(ctx.wizard.params.accountId);
			ctx.wizard.params.message = ctx.callbackQuery?.message;
			if (!account) {
				await ctx.wizard.params.message?.editText("❌ Счёт не найден.");
				return ctx.scene.leave();
			}
			const currentYear = new Date().getFullYear();
			ctx.wizard.state.selectedYear = currentYear;
			await ctx.wizard.params.message?.editText(
				`📅 Выберите месяц (${currentYear}):`, {
				reply_markup: ctx.utils.makeYearMonthKeyboard(currentYear)
			}
			);
			return ctx.wizard.next();
		},
		// Шаг 2: обработка выбора года/месяца 
		async (ctx) => {
			// если нажали на год 
			const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
			if (yearData) {
				ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
				await ctx.callbackQuery?.message?.editText(
					`📅 Выберите месяц (${ctx.wizard.state.selectedYear}):`, {
					reply_markup: ctx.utils.makeYearMonthKeyboard(ctx.wizard.state.selectedYear)
				}
				);
				return;
			}
			// если нажали на месяц 
			const monthData = ctx.callbackQuery?.data?.match(/^select-month-(\d{4})-(\d{1,2})$/);
			if (monthData) {
				ctx.wizard.state.year = parseInt(monthData[1], 10);
				ctx.wizard.state.month = parseInt(monthData[2], 10);

				// Получаем свежие данные аккаунта по ID
				const account: IAccount | null = await Account.findById(ctx.wizard.params.accountId);

				if (!account) {
					await ctx.wizard.params.message?.editText("❌ Счёт не найден.", {
						reply_markup: new InlineKeyboard().text("⬅️ Назад", `utilities-menu`)
					});
					return ctx.scene.leave();
				}

				let zones: string[] = ["standard"];
				if (account.resource === "electricity" && account.meterType) {
					if (account.meterType === MeterType.DAY_NIGHT) zones = ["day", "night"];
					if (account.meterType === MeterType.MULTI_ZONE) zones = ["peak", "half-peak", "night"];
				}
				ctx.wizard.params.zones = zones;
				ctx.wizard.params.zoneValues = [];
				await ctx.callbackQuery?.message?.editText(
					`Введите показания для зоны "${zones[0]}" (${ctx.wizard.state.month}.${ctx.wizard.state.year}):`
				);
				return ctx.wizard.next();
			}
		},
		// Шаг 3+: ввод значений по зонам 
		async (ctx) => {
			const value = Number(ctx.msg?.text);
			if (isNaN(value) || value < 0) {
				await ctx.wizard.params.message?.editText("❌ Введите корректное число.");
				await ctx.msg?.delete();
				return;
			}
			const zones = ctx.wizard.params.zones;
			const zoneValues = ctx.wizard.params.zoneValues;
			const currentIndex = zoneValues.length;
			zoneValues.push({ name: zones[currentIndex], value });
			if (zoneValues.length < zones.length) {
				await ctx.wizard.params.message?.editText(
					`Введите показания для зоны "${zones[zoneValues.length]}" (${ctx.wizard.state.month}.${ctx.wizard.state.year}):`
				);
				await ctx.msg?.delete();
				return;
			}
			await ctx.msg?.delete();
			// все зоны введены → сохраняем 
			try {
				await UtilitiesReading.create({
					account_id: ctx.wizard.params.accountId,
					year: ctx.wizard.state.year,
					month: ctx.wizard.state.month,
					zones: zoneValues,
				});
				await ctx.wizard.params.message?.editText(
					`✅ Показания за ${ctx.wizard.state.month}.${ctx.wizard.state.year} сохранены:\n`
					+ zoneValues.map((z: ZoneReading) => `${z.name}: ${z.value}`).join("\n"), {
					reply_markup: new InlineKeyboard().text("⬅️ Назад", `account-${ctx.wizard.params.accountId}`)
				});
			} catch (err) {
				await ctx.wizard.params.message?.editText("⚠️ Ошибка: показания за этот месяц уже внесены.", {
					reply_markup: new InlineKeyboard().text("⬅️ Назад", `account-${ctx.wizard.params.accountId}`),
				});
			}
			return ctx.scene.leave();
		},
	],
};

export default createReadingScene;
