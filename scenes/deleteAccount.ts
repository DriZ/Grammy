import { CallbackContext, WizardScene } from "../types/index.js";
import { Account } from "../models/index.js";
import { deleteAccount } from "../dbServices/index.js";


const deleteAccountScene: WizardScene<CallbackContext> = {
	name: "delete-account",
	steps: [
		async (ctx) => {
			const accountId = ctx.wizard.state.accountId;
			if (!accountId) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось определить счёт для удаления.");
				return ctx.scene.leave();
			}

			const account = await Account.findById(accountId);
			if (!account) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось найти счёт в БД для удаления.");
				return ctx.scene.leave();
			}

			await ctx.scene.confirmOrCancel(ctx, `Вы уверены, что хотите удалить счёт ${account.account_number}?`)
			return ctx.wizard.next();
		},
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.cancelDeleting(ctx);
				return ctx.scene.leave();
			}
			if (ctx.callbackQuery?.data === "confirm") {
				const accountId = ctx.wizard.state.accountId;
				await deleteAccount(accountId);
				await ctx.scene.backToUtilitiesMenu(ctx, "✅ Счёт и все связанные данные успешно удалёны.");
				return ctx.scene.leave();
			}
			return
		},
	],
};

export default deleteAccountScene;
