import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import { Account } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";


export default class ChangeCurrencyScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "change-currency");
  }

  get steps(): TStepHandler[] {
    return [
      this.askCurrency,
      this.handleCurrency,
    ];
  }

  // Шаг 0: Показываем текущую валюту и предлагаем выбрать новую
  private askCurrency = async (ctx: CallbackContext) => {
    const accountId = ctx.wizard.state.accountId;
    if (!accountId) return this.abort(ctx, ctx.t("error.no-account-id"));

    const account = await Account.findById(accountId);
    if (!account) return this.abort(ctx, ctx.t("error.account-not-found"));

    ctx.wizard.state.message = ctx.callbackQuery?.message;

    await ctx.wizard.state.message?.editText(ctx.t("change-currency.ask", { current: account.currency }), {
      reply_markup: new InlineKeyboard()
        .text("🇺🇦 UAH", "UAH").text("🇺🇸 USD", "USD").text("🇪🇺 EUR", "EUR").row()
        .text("🇷🇺 RUB", "RUB").text("🇰🇿 KZT", "KZT").text("🇧🇾 BYN", "BYN").row()
        .text(ctx.t("button.cancel"), "cancel"), 
        parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  // Шаг 1: Обрабатываем выбор и обновляем БД
  private handleCurrency = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("change-currency.cancelled"), `account-${ctx.wizard.state.accountId}`)) return;

    const currency = ctx.callbackQuery?.data;
    // Простая проверка, что это код валюты (3 символа), а не какая-то другая команда
    if (!currency || currency.length !== 3) return;

    const accountId = ctx.wizard.state.accountId;

    try {
      await Account.findByIdAndUpdate(accountId, { currency });
      return this.abort(ctx, ctx.t("change-currency.success", { currency }), `account-${accountId}`);
    } catch (error) {
      return this.handleError(ctx, error, ctx.t("change-currency.error"), `account-${accountId}`);
    }
  };
}
