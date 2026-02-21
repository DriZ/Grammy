import { InlineKeyboard } from "grammy";
import { UserAddress } from "../models/index.js";
import { CallbackContext, Menu, MenuButton } from "../types/index.js";
import { makeAddressMenu } from "./utility-menus.js";

const utilitiesMenu: Menu = {
	id: "utilities-menu",
	title: "⚙️ Коммунальные услуги",
	inline: true,
	buttons: [
		{
			text: "➕ Создать адрес",
			callback: "create-address",
			action: async (ctx) => {
				await ctx.answerCallbackQuery();
				await ctx.services.sceneManager.enter(ctx as CallbackContext, "create-address");
			},
		},
		{
			text: "❌ Закрыть",
			callback: "close",
			action: async (ctx) => {
				await ctx.answerCallbackQuery();
				await ctx.callbackQuery.message?.delete();
			},
		},
	],
	action: async (ctx) => {
		const telegramId = ctx.from?.id;
		if (!telegramId) return ctx.callbackQuery.message?.editText(
			typeof utilitiesMenu.title === "function" 
				? utilitiesMenu.title(ctx) 
				: utilitiesMenu.title, 
			{
				reply_markup: new InlineKeyboard().text("❌ Закрыть", "cancel"),
			}
		);

		const userAddresses = await UserAddress.find({ telegram_id: telegramId }).populate(
			"address_id",
		);
		const keyboard = new InlineKeyboard();

		if (userAddresses.length > 0) {
			userAddresses.forEach((ua) => {
				const addr = ua.address_id;
				const callback = `address-${addr._id}`;

				// Регистрируем меню для этого адреса
				const addrMenu = makeAddressMenu(addr._id.toString());
				if (!ctx.services.menuManager.menus.has(addrMenu.id))
					ctx.services.menuManager.registerMenu(addrMenu.id, addrMenu);

				keyboard.text(`🏠 ${(addr as any).name}`, callback).row();
			});
		}

		// стандартные кнопки
		utilitiesMenu.buttons.forEach((btn: MenuButton) => {
			keyboard.text(typeof btn.text === "function" ? btn.text(ctx) : btn.text, btn.callback).row();
		});

		if (ctx.callbackQuery) {
			await ctx.callbackQuery.message?.editText(typeof utilitiesMenu.title === "function" ? utilitiesMenu.title(ctx) : utilitiesMenu.title, {
				reply_markup: keyboard,
			});
		} else {
			await ctx.reply(typeof utilitiesMenu.title === "function" ? utilitiesMenu.title(ctx) : utilitiesMenu.title, { reply_markup: keyboard });
		}
	},
};

export default utilitiesMenu;
