import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import { Address, type IAddress } from "@models/index.js";
import { deleteAddress } from "../dbServices/index.js";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { InlineKeyboard } from "grammy";


export default class DeleteAddressScene extends BaseScene {
	constructor(client: BotClient) {
		super(client, "delete-address");
	}

	get steps(): TStepHandler[] {
		return [
			this.askDeletion,
			this.handleDeletion,
		];
	}

	private askDeletion = async (ctx: CallbackContext) => {
		const addressId = ctx.wizard.state.addressId;
		if (!addressId) return this.abort(ctx, "❌ Ошибка: не удалось определить адрес для удаления.");

		const address = await Address.findById(addressId) as IAddress;
		if (!address) return this.abort(ctx, "❌ Ошибка: не удалось найти адрес в БД для удаления.")

		const text = `Вы уверены, что хотите удалить адрес ${address.name}?`;
		await ctx.callbackQuery.message?.editText(text, {
			reply_markup: new InlineKeyboard()
				.text("🗑️ Удалить", "confirm").danger()
				.text("Отмена", "cancel")
		});
		return ctx.wizard.next();
	}

	private handleDeletion = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Удаление отменено.", `address-${ctx.wizard.state.addressId}`)) return;

		if (ctx.callbackQuery?.data === "confirm" || ctx.update.callback_query?.data === "confirm") {
			const addressId = ctx.wizard.state.addressId!;
			try {
				const result = await deleteAddress(addressId, ctx.from.id);
				const msg = result.deletedAll
					? "✅ Адрес и все связанные данные успешно удалены."
					: "✅ Адрес отвязан от вашего профиля.";

				const deletedMenu = `address-${addressId}`;

				ctx.services.menuManager.cleanupForDeletion(ctx, deletedMenu);

				return this.abort(ctx, msg);
			} catch (err) {
				return this.handleError(ctx, err, "❌ Ошибка при удалении адреса.");
			}
		}
		return
	}
};
