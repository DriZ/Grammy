import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import { Address, type IAddress, UserAddress } from "@models/index.js";
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
    if (!addressId) return this.abort(ctx, ctx.t("delete-address.error-no-id"));

    const address = await Address.findById(addressId) as IAddress;
    if (!address) return this.abort(ctx, ctx.t("delete-address.error-not-found"))

    const isOwner = address.ownerId === ctx.from?.id;
    const userAddressCount = await UserAddress.countDocuments({ address_id: addressId });

    let text: string;
    let buttonText: string;

    // Если к адресу привязано больше одного пользователя, и текущий юзер не владелец - это отвязка
    if (userAddressCount > 1 && !isOwner) {
      text = ctx.t("delete-address.confirm-unlink", { address: address.name });
      buttonText = ctx.t("button.unlink-address");
    } else {
      text = ctx.t("delete-address.confirm", { address: address.name });
      buttonText = ctx.t("button.delete");
    }
    await ctx.callbackQuery.message?.editText(text, {
      reply_markup: new InlineKeyboard().text(buttonText, "confirm").danger().text(ctx.t("button.cancel"), "cancel"), 
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  }

  private handleDeletion = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("delete-address.cancelled"), `address-${ctx.wizard.state.addressId}`)) return;

    if (ctx.callbackQuery?.data === "confirm" || ctx.update.callback_query?.data === "confirm") {
      const addressId = ctx.wizard.state.addressId!;
      try {
        const result = await deleteAddress(addressId, ctx.from.id);
        const msg = result.deletedAll
          ? ctx.t("delete-address.success-all")
          : ctx.t("delete-address.success-unlinked");

        const deletedMenu = `address-${addressId}`;

        ctx.services.menuManager.cleanupForDeletion(ctx, deletedMenu);

        return this.abort(ctx, msg);
      } catch (err) {
        return this.handleError(ctx, err, ctx.t("delete-address.error"));
      }
    }
    return
  }
};
