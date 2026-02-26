import { Account } from "../models/index.js";
import { type CallbackContext, EResource } from "../types/index.js";
import { InlineKeyboard } from "grammy";
import { ReadingsMenu } from "./readingMenus.js";
import { TariffsMenu } from "./tariffMenus.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";

export class AccountMenu extends BaseMenu {
	constructor(client: BotClient, private accountId: string, private addressId: string) {
		super(client, `account-${accountId}`);
	}

	get title() {
		return "⚡ Меню счёта";
	}

	// Кнопки здесь больше для документации или если мы захотим их использовать в execute
	// Основная логика рендеринга в execute
	get buttons() {
		return [];
	}

	async execute(ctx: CallbackContext) {
		const keyboard = new InlineKeyboard()
			.text("💲 Тарифы", `tariffs-${this.accountId}`)
			.row()
			.text("🧾 К оплате", `calculate-bill-${this.accountId}`)
			.row()
			.text("📊 Показания", `readings-${this.accountId}`)
			.row()
			.text("🗑️ Удалить счёт", `delete-account-${this.accountId}`).danger()
			.row()
			.text("⬅️ Назад", `menu-back`);

		const account = await Account.findById(this.accountId);
		if (!account) throw new Error(`Счёт с id ${this.accountId} не найден`);

		ctx.services.menuManager.registerMenu(`readings-${this.accountId}`, new ReadingsMenu(this.client, this.accountId));
		ctx.services.menuManager.registerMenu(`tariffs-${this.accountId}`, new TariffsMenu(this.client, this.accountId));

		const title = `${EResource[account.resource].emoji ?? "⚡️"} Меню счёта №${account.account_number}`;
		if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
		else await ctx.reply(title, { reply_markup: keyboard });
	}
}
