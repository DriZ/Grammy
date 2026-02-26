import { Account, Address } from "../models/index.js";
import { type CallbackContext, EResource } from "../types/index.js";
import { InlineKeyboard } from "grammy";
import { AccountMenu } from "./accountMenus.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";

export class AddressMenu extends BaseMenu {
	constructor(client: BotClient, private addressId: string) {
		super(client, `address-${addressId}`);
	}

	get title() {
		return "📋 Счета по адресу";
	}

	async execute(ctx: CallbackContext) {
		const accounts = await Account.find({ address_id: this.addressId });
		const address = await Address.findById(this.addressId);
		if (!address) {
			throw new Error(`Адрес с id ${this.addressId} не найден`);
		}

		const keyboard = new InlineKeyboard();

		if (accounts.length > 0) {
			accounts.forEach((acc) => {
				const emoji = EResource[acc.resource].emoji;

				ctx.services.menuManager.registerMenu(
					`account-${acc._id.toString()}`,
					new AccountMenu(this.client, acc._id.toString(), this.addressId),
				);
				keyboard
					.text(`${emoji} Счёт №${acc.account_number}`, `account-${acc._id}`)
					.row();
			});
		}

		keyboard.text("➕ Добавить счёт", `create-account-${this.addressId}`).row();
		if (accounts.length === 0)
			keyboard.text("🗑️ Удалить адрес", `delete-address-${this.addressId}`).danger().row();
		keyboard.text("⬅️ Назад", "menu-back");

		const title = `📋 Счета по адресу ${address.name}:`;
		if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
		else await ctx.reply(title, { reply_markup: keyboard });
	}
}
