import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import { Tariff } from "@models/index.js";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";



export default class DeleteTariffScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "delete-tariff");
  }
  get steps(): TStepHandler[] {
    return [
      this.askDeletion,
      this.handleDeletion,
    ];
  }

  private askDeletion = async (ctx: CallbackContext) => {
    const tariffId = ctx.wizard.state.tariffId;
    if (!tariffId) return this.abort(ctx, ctx.t("delete-tariff.error-no-id"));

    const tariff = await Tariff.findById(tariffId);
    if (!tariff) return this.abort(ctx, ctx.t("delete-tariff.error-not-found"));

    ctx.wizard.state.accountId = tariff.account_id.toString();

    await this.confirmOrCancel(ctx, ctx.t("delete-tariff.confirm", { type: tariff.type }));
    return ctx.wizard.next();
  }

  private handleDeletion = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("delete-tariff.cancelled"), `tariff-${ctx.wizard.state.tariffId}`)) return;
    if (ctx.callbackQuery?.data === "confirm") {
      const tariffId = ctx.wizard.state.tariffId;
      await Tariff.findByIdAndDelete(tariffId);

      const accountId = ctx.wizard.state.accountId;
      const parentMenu = `tariffs-${accountId}`;
      const deletedMenu = `tariff-${tariffId}`;

      ctx.services.menuManager.cleanupForDeletion(ctx, deletedMenu, parentMenu);

      return this.abort(ctx, ctx.t("delete-tariff.success"), parentMenu);
    }
    return
  }
}