import { CallbackContext, WizardScene } from "../types/index.js";
import { UtilitiesReading } from "../models/index.js";
import { InlineKeyboard } from "grammy";

const deleteReadingScene: WizardScene<CallbackContext> = {
	name: "delete-reading",
	steps: [
		// Шаг 1: Подтверждение удаления
		async (ctx) => {
			const readingId = ctx.wizard.params.readingId;
			if (!readingId) {
				await ctx.callbackQuery?.message?.editText(
					"❌ Ошибка: не удалось определить показание.",
					{
						reply_markup: new InlineKeyboard().text("Назад", "utilities-menu"),
					},
				);
				return ctx.scene.leave();
			}

			const reading = await UtilitiesReading.findById(readingId);
			if (!reading) {
				await ctx.callbackQuery?.message?.editText("❌ Показание не найдено.", {
					reply_markup: new InlineKeyboard().text("Назад", "utilities-menu"),
				});
				return ctx.scene.leave();
			}

			// Сохраняем accountId для кнопки "Назад"
			ctx.wizard.state.accountId = reading.account_id;

			await ctx.callbackQuery?.message?.editText(
				`Вы уверены, что хотите удалить показания за ${reading.month}.${reading.year}?`,
				{
					reply_markup: new InlineKeyboard()
						.text("Удалить", "confirm")
						.danger()
						.text("Отмена", "cancel"),
				},
			);
			return ctx.wizard.next();
		},
		// Шаг 2: Обработка решения
		async (ctx) => {
			const accountId = ctx.wizard.state.accountId;
			const backBtn = new InlineKeyboard().text(
				"Назад",
				accountId ? `account-${accountId}` : "utilities-menu",
			);

			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.callbackQuery.message?.editText("❌ Удаление отменено.", {
					reply_markup: backBtn,
				});
				return ctx.scene.leave();
			}

			if (ctx.callbackQuery?.data === "confirm") {
				const readingId = ctx.wizard.params.readingId;
				await UtilitiesReading.findByIdAndDelete(readingId);
				await ctx.callbackQuery.message?.editText("✅ Показания успешно удалены.", {
					reply_markup: backBtn,
				});
			}
			return ctx.scene.leave();
		},
	],
};

export default deleteReadingScene;
