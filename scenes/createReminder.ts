import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { Reminder } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";

const cancelBtn = (ctx: CallbackContext) => new InlineKeyboard().text(ctx.t("button.cancel"), "cancel");

export default class CreateReminderScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "create-reminder");
  }

  get steps(): TStepHandler[] {
    return [
      this.askTitle,
      this.handleTitle,
      this.handleDay,
      this.handleTime,
    ];
  }

  private askTitle = async (ctx: CallbackContext) => {
    ctx.wizard.state.message = ctx.callbackQuery?.message;
    await ctx.wizard.state.message?.editText(ctx.t("create-reminder.ask-title"), {
      reply_markup: cancelBtn(ctx), 
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  private handleTitle = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-reminder.cancelled"), "reminders-menu")) return;

    if (!ctx.msg?.text) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("create-reminder.error-text"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return;
    }

    ctx.wizard.state.title = ctx.msg.text;
    await ctx.msg.delete();

    await ctx.wizard.state.message?.editText(ctx.t("create-reminder.ask-day"), {
      reply_markup: cancelBtn(ctx), 
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  private handleDay = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-reminder.cancelled"), "reminders-menu")) return;

    const day = parseInt(ctx.msg?.text || "");
    if (isNaN(day) || day < 1 || day > 31) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("create-reminder.error-day"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return;
    }

    await ctx.msg?.delete();

    ctx.wizard.state.day = day;

    await ctx.wizard.state.message?.editText(ctx.t("create-reminder.ask-time"), {
      reply_markup: cancelBtn(ctx), 
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  private handleTime = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-reminder.cancelled"), "reminders-menu")) return;

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const text = ctx.msg?.text || "";
    const match = text.match(timeRegex);

    if (!match) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("create-reminder.error-time"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return;
    }

    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);

    await ctx.msg?.delete();

    try {
      await Reminder.create({
        telegram_id: ctx.from?.id,
        title: ctx.wizard.state.title,
        dayOfMonth: ctx.wizard.state.day,
        hour: hour,
        minute: minute,
      });

      return this.abort(ctx, ctx.t("create-reminder.success"), "reminders-menu");
    } catch (error) {
      return this.handleError(ctx, error, ctx.t("create-reminder.error"), "reminders-menu");
    }
  };
}
