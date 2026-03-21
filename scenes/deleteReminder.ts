import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import { Reminder } from "@models/index.js";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";

export default class DeleteReminderScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "delete-reminder");
  }
  get steps(): TStepHandler[] {
    return [this.askDeletion, this.handleDeletion];
  }

  private askDeletion = async (ctx: CallbackContext) => {
    const reminderId = ctx.wizard.state.reminderId;
    if (!reminderId) return this.abort(ctx, ctx.t("error.no-id"));

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) return this.abort(ctx, ctx.t("error.not-found"));

    await this.confirmOrCancel(ctx, ctx.t("delete-reminder.confirm", { title: reminder.title }));
    ctx.wizard.state.reminderTitle = reminder.title;
    return ctx.wizard.next();
  }

  private handleDeletion = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("delete-reminder.cancelled"), `reminder-${ctx.wizard.state.reminderId}`)) return;
    if (ctx.callbackQuery?.data === "confirm") {
      try {
        await Reminder.findByIdAndDelete(ctx.wizard.state.reminderId);
        const parentMenu = "reminders-menu";
        ctx.services.menuManager.cleanupForDeletion(ctx, `reminder-${ctx.wizard.state.reminderId}`, parentMenu);
        return this.abort(ctx, ctx.t("delete-reminder.success", { title: ctx.wizard.state.reminderTitle }), parentMenu);
      } catch (err) {
        return this.handleError(ctx, err, ctx.t("delete-reminder.error", { title: ctx.wizard.state.reminderTitle }));
      }
    }
  }
}
