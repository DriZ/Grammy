import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { Account, FixedFee } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";

const cancelBtn = (ctx: CallbackContext) => new InlineKeyboard().text(ctx.t("button.cancel"), "cancel");

export default class CreateFixedFeeScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "create-fixedfee");
  }

  get steps(): TStepHandler[] {
    return [
      this.askDate,
      this.handleDateAndAskAmount,
      this.handleAmount,
    ];
  }

  // Шаг 0: Выбор даты
  private askDate = async (ctx: CallbackContext) => {
    const accountId = ctx.wizard.state.accountId;
    if (!accountId) return this.abort(ctx, ctx.t("error.no-account-id"));

    ctx.wizard.state.message = ctx.callbackQuery?.message;
    const currentYear = new Date().getFullYear();
    ctx.wizard.state.selectedYear = currentYear;

    await ctx.wizard.state.message?.editText(
      ctx.t("create-fixed-fee.ask-date", { year: currentYear }),
      { reply_markup: this.makeYearMonthKeyboard(currentYear), parse_mode: "HTML" },
    );
    return ctx.wizard.next();
  };

  // Шаг 1: Обработка даты и запрос суммы
  private handleDateAndAskAmount = async (ctx: CallbackContext) => {
    const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
    if (yearData) {
      ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
      await ctx.callbackQuery?.message?.editText(
        ctx.t("create-fixed-fee.ask-date", { year: ctx.wizard.state.selectedYear }),
        { reply_markup: this.makeYearMonthKeyboard(ctx.wizard.state.selectedYear), parse_mode: "HTML" },
      );
      return;
    }

    const monthData = ctx.callbackQuery?.data?.match(/^select-month-(\d{4})-(\d{1,2})$/);
    if (monthData) {
      const year = parseInt(monthData[1], 10);
      const month = parseInt(monthData[2], 10);
      ctx.wizard.state.startDate = new Date(year, month - 1, 1);

      const account = await Account.findById(ctx.wizard.state.accountId);
      await ctx.callbackQuery?.message?.editText(ctx.t("create-fixed-fee.ask-amount", { currency: account!.currency }), { 
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML" 
      });
      return ctx.wizard.next();
    }
  };

  // Шаг 2: Ввод суммы и сохранение
  private handleAmount = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-fixed-fee.cancelled"), `fixed-fees-${ctx.wizard.state.accountId}`)) return;

    const amount = parseFloat(ctx.msg?.text?.replace(",", ".") || "");
    if (isNaN(amount) || amount < 0) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("error.invalid-number"), { 
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML" 
      });
      return;
    }

    await ctx.msg?.delete();

    try {
      await FixedFee.create({
        account_id: ctx.wizard.state.accountId,
        amount: amount,
        startDate: ctx.wizard.state.startDate,
      });

      const account = await Account.findById(ctx.wizard.state.accountId);
      const title = ctx.t("create-fixed-fee.success", { amount, currency: account!.currency });
      return this.abort(ctx, title, `fixed-fees-${ctx.wizard.state.accountId}`);
    } catch (error) {
      return this.handleError(ctx, error, ctx.t("create-fixed-fee.error"), `fixed-fees-${ctx.wizard.state.accountId}`);
    }
  };
}
