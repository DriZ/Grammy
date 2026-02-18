import { InlineKeyboard } from "grammy";
import { UserAddress } from "../models/index.js";
import { CallbackContext, Menu, MenuButton } from "../types/index.js";

const utilitiesMenu: Menu = {
  id: "address-menu",
  title: "📋 Счета по адресу",
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
    if (!telegramId) {
      return ctx.reply("❌ Ошибка: не удалось получить ваш Telegram ID.");
    }

    const userAddresses = await UserAddress.find({ telegram_id: telegramId }).populate("address_id");

    const keyboard = new InlineKeyboard();

    if (userAddresses.length > 0) {
      userAddresses.forEach((ua) => {
        const addr = ua.address_id as any;
        const callback = `address-${addr._id}`;

        // Регистрируем меню для этого адреса
        const addrMenu = ctx.utils.makeAddressMenu(addr._id.toString());
        if (!ctx.services.menuHandler.menus.has(addrMenu.id)) ctx.services.menuHandler.registerMenu(addrMenu.id, addrMenu);

        keyboard.text(`🏠 ${addr.name}`, callback).row();
      });
    }

    // стандартные кнопки
    utilitiesMenu.buttons.forEach((btn: MenuButton) => {
      keyboard.text(btn.text, btn.callback).row();
    });

    if (ctx.callbackQuery) {
      await ctx.callbackQuery.message?.editText(utilitiesMenu.title, { reply_markup: keyboard });
    } else {
      await ctx.reply(utilitiesMenu.title, { reply_markup: keyboard });
    }
  },
};

export default utilitiesMenu;
