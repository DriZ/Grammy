import { type CallbackContext, type TStepHandler, EResource } from "@app-types/index.js";
import { Account } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";

export default class ChangeUnitScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "change-unit");
  }

  get steps(): TStepHandler[] {
    return [
      this.askUnit,
      this.handleUnit,
    ];
  }

  // Шаг 0: Показываем текущую единицу и предлагаем выбрать новую
  private askUnit = async (ctx: CallbackContext) => {
    const accountId = ctx.wizard.state.accountId;
    if (!accountId) return this.abort(ctx, ctx.t("error.no-account-id"));

    const account = await Account.findById(accountId);
    if (!account) return this.abort(ctx, ctx.t("error.account-not-found"));

    ctx.wizard.state.message = ctx.callbackQuery?.message;

    const resource = account.resource;
    const units = EResource[resource].units;
    const currentUnit = account.unit || units[0];

    const keyboard = new InlineKeyboard();
    units.forEach((u) => {
      // Если это текущая единица, можно пометить её (опционально), но пока просто выводим список
      keyboard.text(u, u).row();
    });
    keyboard.text(ctx.t("button.cancel"), "cancel");

    await ctx.wizard.state.message?.editText(ctx.t("change-unit.ask", { current: currentUnit }), {
      reply_markup: keyboard, 
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  // Шаг 1: Обрабатываем выбор и обновляем БД
  private handleUnit = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("change-unit.cancelled"), `account-${ctx.wizard.state.accountId}`)) return;

    const unit = ctx.callbackQuery?.data;
    if (!unit) return;

    const accountId = ctx.wizard.state.accountId;

    try {
      await Account.findByIdAndUpdate(accountId, { unit });
      return this.abort(ctx, ctx.t("change-unit.success", { unit }), `account-${accountId}`);
    } catch (error) {
      return this.handleError(ctx, error, ctx.t("change-unit.error"), `account-${accountId}`);
    }
  };
}
