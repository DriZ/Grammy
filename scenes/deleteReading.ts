import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import type BotClient from "@core/Client.js";
import { BaseScene } from "@core/structures/index.js";
import { UtilitiesReading } from "@models/index.js";


export default class DeleteReadingScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "delete-reading");
  }

  get steps(): TStepHandler[] {
    return [
      this.askDeletion,
      this.handleDeletion,
    ];
  }

  private askDeletion = async (ctx: CallbackContext) => {
    const readingId = ctx.wizard.state.readingId;
    if (!readingId) {
      return this.abort(ctx, ctx.t("delete-reading.error-no-id"));
    }

    const reading = await UtilitiesReading.findById(readingId);
    if (!reading) {
      return this.abort(ctx, ctx.t("delete-reading.error-not-found"));
    }

    ctx.wizard.state.accountId = reading.account_id.toString();

    await this.confirmOrCancel(ctx, ctx.t("delete-reading.confirm", { date: `${reading.month}.${reading.year}` }));
    return ctx.wizard.next();
  }

  private handleDeletion = async (ctx: CallbackContext) => {
    const readingId = ctx.wizard.state.readingId!;
    if (await this.checkCancel(ctx, ctx.t("delete-reading.cancelled"), `reading-${readingId}`)) return;
    if (ctx.callbackQuery?.data === "confirm") {
      await UtilitiesReading.findByIdAndDelete(readingId);

      const accountId = ctx.wizard.state.accountId;
      const parentMenu = `readings-${accountId}`;
      const deletedMenu = `reading-${readingId}`;

      ctx.services.menuManager.cleanupForDeletion(ctx, deletedMenu, parentMenu);

      return this.abort(ctx, ctx.t("delete-reading.success"), parentMenu);
    }
    return
  }
};
