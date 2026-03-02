import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { Address, User, UserAddress } from "@models/index.js";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { InlineKeyboard } from "grammy";

const cancelBtn = (ctx: CallbackContext) => new InlineKeyboard().text(ctx.t("button.cancel"), "cancel");

export default class TransferAddressScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "transfer-address");
  }

  get steps(): TStepHandler[] {
    return [
      this.confirmTransfer,
      this.executeTransfer
    ];
  }

  private confirmTransfer = async (ctx: CallbackContext) => {
    const { addressId, targetUserId } = ctx.wizard.state;

    if (!addressId) return this.abort(ctx, ctx.t("error.address-not-found", { id: "unknown" }));
    if (!targetUserId) return this.abort(ctx, ctx.t("transfer-address.error-user-not-found"));

    const address = await Address.findById(addressId);
    if (!address) return this.abort(ctx, ctx.t("error.address-not-found", { id: addressId }));

    const targetUser = await User.findOne({ telegram_id: targetUserId });
    if (!targetUser) {
      await ctx.reply(ctx.t("transfer-address.error-user-not-found"), { reply_markup: cancelBtn(ctx) });
      return;
    }

    ctx.wizard.state.address = address;
    ctx.wizard.state.targetUser = targetUser;
    ctx.wizard.state.message = ctx.callbackQuery?.message;

    // Получаем информацию о пользователе из Telegram, так как в БД только ID
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

    const addressName = ctx.escapeHTML(ctx.wizard.state.address.name);
    const userName = ctx.escapeHTML(displayName);

    await ctx.wizard.state.message?.editText(
      ctx.t("transfer-address.confirm", { address: addressName, user: userName }),
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .text(ctx.t("button.transfer-address"), "confirm").row()
          .text(ctx.t("button.cancel"), "cancel")
      }
    );

    return ctx.wizard.next();
  }

  private executeTransfer = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("transfer-address.cancelled"), `address-${ctx.wizard.state.addressId}`)) return;

    if (ctx.callbackQuery?.data === "confirm") {
      const addressId = ctx.wizard.state.addressId;
      const targetUser = ctx.wizard.state.targetUser;

      try {
        await Address.findByIdAndUpdate(addressId, { ownerId: targetUser.telegram_id });

        // Гарантируем, что у нового владельца адрес привязан
        await UserAddress.findOneAndUpdate(
          { telegram_id: targetUser.telegram_id, address_id: addressId },
          { telegram_id: targetUser.telegram_id, address_id: addressId },
          { upsert: true, new: true }
        );

        return this.abort(ctx, ctx.t("transfer-address.success"), `address-${addressId}`);
      } catch (e) {
        console.error(e);
        return this.handleError(ctx, e, ctx.t("transfer-address.error"));
      }
    }
  }
}
