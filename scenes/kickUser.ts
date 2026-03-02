import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { Address, User, UserAddress } from "@models/index.js";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { InlineKeyboard } from "grammy";

export default class KickUserScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "kick-user");
  }

  get steps(): TStepHandler[] {
    return [
      this.confirmKick,
      this.executeKick
    ];
  }

  private confirmKick = async (ctx: CallbackContext) => {
    const { addressId, targetUserId } = ctx.wizard.state;
    if (!addressId || !targetUserId) return this.abort(ctx, ctx.t("error.not-found"));

    const address = await Address.findById(addressId);
    const targetUser = await User.findOne({ telegram_id: targetUserId });

    if (!address || !targetUser) return this.abort(ctx, ctx.t("error.not-found"));

    let displayName = targetUserId.toString();
    try {
      const chat = await ctx.api.getChat(targetUserId);
      if (chat.type === "private") {
        displayName = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
        if (chat.username) displayName += ` (@${chat.username})`;
      }
    } catch (e) {
      // Игнорируем ошибку, используем ID
    }

    const addressName = ctx.escapeHTML(address.name);
    const userName = ctx.escapeHTML(displayName);

    const text = ctx.t("kick-user.confirm", { user: userName, address: addressName });

    await ctx.callbackQuery?.message?.editText(text, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .text(ctx.t("button.kick-user"), "confirm").danger().row()
        .text(ctx.t("button.cancel"), "cancel")
    });

    return ctx.wizard.next();
  }

  private executeKick = async (ctx: CallbackContext) => {
    const { addressId, targetUserId } = ctx.wizard.state;
    const backMenu = `address-users-${addressId}`;

    if (await this.checkCancel(ctx, ctx.t("scene.action-canceled"), backMenu)) return;

    if (ctx.callbackQuery?.data === "confirm") {
      try {
        await UserAddress.findOneAndDelete({ address_id: addressId, telegram_id: targetUserId });
        return this.abort(ctx, ctx.t("kick-user.success"), backMenu);
      } catch (e) {
        console.error(e);
        return this.handleError(ctx, e, ctx.t("kick-user.error"));
      }
    }
  }
}
