import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import { Tariff } from "@models/index.js";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";



export default class DeleteTariffScene extends BaseScene {
	constructor(client: BotClient) {
		super(client, "delete-tariff");
	}
	get steps(): TStepHandler[] {
		return [
			this.askDeletion,
			this.handleDeletion,
		];
	}

	private askDeletion = async (ctx: CallbackContext) => {
		const tariffId = ctx.wizard.state.tariffId;
		if (!tariffId) return this.abort(ctx, "❌ Ошибка: не удалось определить тариф для удаления.");

		const tariff = await Tariff.findById(tariffId);
		if (!tariff) return this.abort(ctx, "❌ Ошибка: не удалось найти тариф в БД для удаления.");

		ctx.wizard.state.accountId = tariff.account_id.toString();

		await ctx.scene.confirmOrCancel(ctx, `Вы уверены, что хотите удалить тариф ${tariff.type}?`);
		return ctx.wizard.next();
	}

	private handleDeletion = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Удаление отменено.", `tariff-${ctx.wizard.state.tariffId}`)) return;
		if (ctx.callbackQuery?.data === "confirm") {
			const tariffId = ctx.wizard.state.tariffId;
			await Tariff.findByIdAndDelete(tariffId);

			const accountId = ctx.wizard.state.accountId;
			const parentMenu = `tariffs-${accountId}`;
			const deletedMenu = `tariff-${tariffId}`;

			ctx.services.menuManager.cleanupForDeletion(ctx, deletedMenu, parentMenu);

			return this.abort(ctx, "✅ Тариф успешно удалён.", parentMenu);
		}
		return
	}
}