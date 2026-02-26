import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { Account } from "@models/index.js";
import { deleteAccount } from "../dbServices/index.js";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";


export default class deleteAccountScene extends BaseScene {
	constructor(client: BotClient) {
		super(client, "delete-account");
	}

	get steps(): TStepHandler[] {
		return [
			this.askDeletion,
			this.handleDeletion,
		];
	}

	private askDeletion = async (ctx: CallbackContext) => {
		const accountId = ctx.wizard.state.accountId;
		if (!accountId) return this.abort(ctx, "❌ Ошибка: не удалось определить счёт для удаления.");

		const account = await Account.findById(accountId);
		if (!account) return this.abort(ctx, "❌ Ошибка: не удалось найти счёт в БД для удаления.");
		ctx.wizard.state.addressId = account.address_id.toString();

		await ctx.scene.confirmOrCancel(ctx, `Вы уверены, что хотите удалить счёт ${account.account_number}?`)
		return ctx.wizard.next();
	}

	private handleDeletion = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Удаление отменено.", `account-${ctx.wizard.state.accountId}`)) return;

		if (ctx.callbackQuery?.data === "confirm") {
			const accountId = ctx.wizard.state.accountId;
			const addressId = ctx.wizard.state.addressId;
			await deleteAccount(accountId);

			const parentMenu = `address-${addressId}`;
			const deletedMenu = `account-${accountId}`;

			ctx.services.menuManager.cleanupForDeletion(ctx, deletedMenu, parentMenu);

			return this.abort(ctx, "✅ Счёт и все связанные данные успешно удалёны.", parentMenu);
		}
		return
	}
};
