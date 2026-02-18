import { CallbackContext, WizardScene } from "../types/index.js";
import { Account } from "../models/index.js";
import { InlineKeyboard } from "grammy";
import { deleteAccount } from "../dbServices/index.js";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel").danger();

const deleteAccountScene: WizardScene<CallbackContext> = {
	name: "delete-account",
	steps: [
		async (ctx) => {
			const accountId = ctx.wizard.params.accountId;
			if (!accountId) {
				await ctx.callbackQuery?.message?.editText(
					"❌ Ошибка: не удалось определить счёт для удаления.",
					{
						reply_markup: cancelBtn,
					},
				);
				return ctx.scene.leave();
			}

			const account = await Account.findById(accountId);
			await ctx.callbackQuery?.message?.editText(
				`Вы уверены, что хотите удалить счёт ${account?.account_number}?`,
				{
					reply_markup: new InlineKeyboard()
						.text("Удалить", "confirm")
						.danger()
						.text("Отмена", "cancel"),
				},
			);
			return ctx.wizard.next();
		},
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.callbackQuery.message?.editText("❌ Удаление отменено.", {
					reply_markup: new InlineKeyboard().text("Назад", "utilities-menu"),
				});
				return ctx.scene.leave();
			}
			if (ctx.callbackQuery?.data === "confirm") {
				const accountId = ctx.wizard.params.accountId;
				await deleteAccount(accountId);
				await ctx.callbackQuery.message?.editText(
					"✅ Счёт и все связанные данные успешно удалёны.",
					{
						reply_markup: new InlineKeyboard().text("Назад", "utilities-menu"),
					},
				);
			}
			return ctx.scene.leave();
		},
	],
};

export default deleteAccountScene;
