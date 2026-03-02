import { Address, User, UserAddress } from "@models/index.js";
import { BaseCommand } from "@core/structures/BaseCommand.js";
import { InlineKeyboard } from "grammy";
import { type CallbackContext, EPermissionLevel } from "@app-types/index.js";
import { Types } from "mongoose";
import type BotClient from "@core/Client.js";


export default class StartCommand extends BaseCommand {
  public client: BotClient;

  constructor(client: BotClient) {
    super(client, {
      name: "start",
      category: "General",
      usage: "/start",
      aliases: [],
      enabled: true,
      location: null,
      description: "",
      permission: EPermissionLevel.User,
      showInMenu: false,
    });
    this.client = client;
  }

  async execute(ctx: CallbackContext, args: string[]): Promise<void> {
    const payload = args[0];

    // Обработка инвайт-ссылки
    if (payload && payload.startsWith("invite_")) {
      const addressId = payload.replace("invite_", "");
      await this.handleInvite(ctx, addressId);
      return;
    }

    await ctx.msg?.delete();
    const mainMenu = this.client.menuManager.menus.get("main-menu");
    if (!mainMenu) {
      await ctx.reply(ctx.t("main-menu.not-found"));
      return;
    }

    const keyboard = new InlineKeyboard();
    const buttons = typeof mainMenu.buttons === "function" ? await mainMenu.buttons(ctx) : mainMenu.buttons;
    for (const b of buttons) {
      const buttonText = await ctx.resolveText(b.text);
      keyboard.text(buttonText, b.callback || b.nextMenu || "noop").row();
    }
    keyboard.text(ctx.t("main-menu.button-commands")).row();

    if (ctx.from) {
      const user = await User.findOne({ telegram_id: ctx.from.id });
      if (!user) {
        await User.create({
          telegram_id: ctx.from.id,
          language: await ctx.i18n.getLocale(),
        });
      }
    }

    await ctx.reply(await ctx.resolveText(mainMenu.title), { reply_markup: keyboard, parse_mode: "HTML" });
    return;
  }

  private async handleInvite(ctx: CallbackContext, addressId: string) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    if (!Types.ObjectId.isValid(addressId)) {
      await ctx.reply(ctx.t("invite.not-found"));
      return;
    }

    try {
      const address = await Address.findById(addressId);
      if (!address) {
        await ctx.reply(ctx.t("invite.not-found"));
        return;
      }

      const existingLink = await UserAddress.findOne({ telegram_id: telegramId, address_id: addressId });
      if (existingLink) {
        await ctx.reply(ctx.t("invite.already-member", { address: ctx.escapeHTML(address.name) }), { parse_mode: "HTML" });
        await ctx.services.menuManager.showMenu(ctx, `address-${addressId}`);
        return;
      }

      await UserAddress.create({
        telegram_id: telegramId,
        address_id: addressId,
      });

      await ctx.reply(ctx.t("invite.success", { address: ctx.escapeHTML(address.name) }), { parse_mode: "HTML" });
      await ctx.services.menuManager.showMenu(ctx, `address-${addressId}`);

    } catch (error) {
      console.error("Error joining address via invite:", error);
      await ctx.reply(ctx.t("invite.error"));
    }
  }
}
