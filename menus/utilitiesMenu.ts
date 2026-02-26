import { InlineKeyboard } from "grammy";
import { UserAddress } from "../models/index.js";
import type { CallbackContext, IMenuButton } from "../types/index.js";
import { AddressMenu } from "./addressMenus.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";

export default class UtilitiesMenu extends BaseMenu {
	constructor(client: BotClient) {
		super(client, "utilities-menu");
	}

	get title(): string | ((ctx: CallbackContext) => string) {
		return (ctx: CallbackContext) => ctx.t("utilities-menu.title");
	}

	get buttons(): IMenuButton[] {
		return [
			{
				text: ctx => ctx.t("button.create-address"),
				callback: "create-address",
				action: async (ctx) => {
					await ctx.answerCallbackQuery();
					await ctx.services.sceneManager.enter(ctx as CallbackContext, "create-address");
				},
			},
			{
				text: ctx => ctx.t("button.close"),
				callback: "delete-msg",
				action: async (ctx) => {
					await ctx.answerCallbackQuery();
					await ctx.callbackQuery?.message?.delete();
				},
			},
		];
	}

	async execute(ctx: CallbackContext) {
		const telegramId = ctx.from?.id;
		if (!telegramId) return super.execute(ctx);

		const userAddresses = await UserAddress.find({ telegram_id: telegramId }).populate(
			"address_id",
		);
		const keyboard = new InlineKeyboard();

		if (userAddresses.length > 0) {
			userAddresses.forEach((ua) => {
				const addr = ua.address_id;
				const callback = `address-${addr._id}`;

				// Регистрируем меню для этого адреса
				const addrMenu = new AddressMenu(this.client, addr._id.toString());
				this.registerSubMenu(ctx, addrMenu);

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				keyboard.text(`🏠 ${(addr as any).name}`, callback).row();
			});
		}

		// стандартные кнопки
		this.buttons.forEach((btn: IMenuButton) => {
			keyboard.text(typeof btn.text === "function" ? btn.text(ctx) : btn.text, btn.callback).row();
		});

		const title = typeof this.title === "function" ? this.title(ctx) : this.title;

		if (ctx.callbackQuery) {
			await ctx.callbackQuery.message?.editText(title, {
				reply_markup: keyboard,
			});
		} else {
			await ctx.reply(title, { reply_markup: keyboard });
		}
	}
}
