import type { CallbackContext } from "@app-types/index.js";
import { Address, User, UserAddress } from "@models/index.js";
import type BotClient from "@core/Client.js";

export class JoinService {
  private client: BotClient;

  constructor(client: BotClient) {
    this.client = client;
  }

  public async approveRequest(ctx: CallbackContext, addressId: string, userIdStr: string) {
    if (!addressId || !userIdStr) return;
    const userId = parseInt(userIdStr, 10);

    try {
      const address = await Address.findById(addressId);
      if (!address) {
        await ctx.answerCallbackQuery({ text: ctx.t("invite.not-found") });
        return;
      }

      const existing = await UserAddress.findOne({ telegram_id: userId, address_id: addressId });
      if (!existing) {
        await UserAddress.create({ telegram_id: userId, address_id: addressId });
      }

      try {
        const userLang = (await User.findOne({ telegram_id: userId }))?.language || "ru";
        await this.client.api.sendMessage(userId, this.client.i18n.t(userLang, "invite.approved-user", { address: this.client.utils.escapeHTML(address.name) }), { parse_mode: "HTML" });
        // eslint-disable-next-line no-empty
      } catch (e) { }

      let userName = userId.toString();
      try {
        const chat = await this.client.api.getChat(userId);
        if (chat.type === "private") {
          userName = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
        }
        // eslint-disable-next-line no-empty
      } catch (e) { }

      await ctx.editMessageText(ctx.t("invite.approved-owner", { user: this.client.utils.escapeHTML(userName) }), { parse_mode: "HTML", reply_markup: undefined });

      setTimeout(() => {
        ctx.deleteMessage().catch(() => { /* ignore */ });
      }, 5000);
    } catch (e) {
      console.error(e);
      await ctx.answerCallbackQuery({ text: ctx.t("error.command-failed") });
    }
  }

  public async rejectRequest(ctx: CallbackContext, addressId: string, userIdStr: string) {
    if (!addressId || !userIdStr) return;
    const userId = parseInt(userIdStr, 10);

    try {
      const address = await Address.findById(addressId);
      if (address) {
        try {
          const userLang = (await User.findOne({ telegram_id: userId }))?.language || "ru";
          await this.client.api.sendMessage(userId, this.client.i18n.t(userLang, "invite.rejected-user", { address: this.client.utils.escapeHTML(address.name) }), { parse_mode: "HTML" });
          // eslint-disable-next-line no-empty
        } catch (e) { }
      }

      let userName = userId.toString();
      try {
        const chat = await this.client.api.getChat(userId);
        if (chat.type === "private") {
          userName = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
        }
        // eslint-disable-next-line no-empty
      } catch (e) { }

      await ctx.editMessageText(ctx.t("invite.rejected-owner", { user: this.client.utils.escapeHTML(userName) }), { parse_mode: "HTML", reply_markup: undefined });

      setTimeout(() => {
        ctx.deleteMessage().catch(() => { /* ignore */ });
      }, 5000);
    } catch (e) {
      console.error(`Error rejecting join request for user ${userId}:`, e);
    }
  }
}
