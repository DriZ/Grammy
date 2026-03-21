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
      this.askArea,
      this.handleArea
    ];
  }

  // Шаг 0: Показываем текущую единицу и предлагаем выбрать новую
  private askUnit = async (ctx: CallbackContext) => {
    const accountId = ctx.wizard.state.accountId;
    if (!accountId) return this.abort(ctx, ctx.t("error.no-account-id"));

    const account = await Account.findById(accountId);
    if (!account) return this.abort(ctx, ctx.t("error.account-not-found"));
    ctx.wizard.state.account = account;
    ctx.wizard.state.message = ctx.callbackQuery?.message;

    const resource = account.resource;
    const units = EResource[resource].units;
    const currentUnit = account.unit || units[0];

    const keyboard = new InlineKeyboard();
    units.forEach((u) => {
      // Если это текущая единица, можно пометить её (опционально), но пока просто выводим список
      keyboard.text(ctx.t(u), u).row();
    });
    keyboard.text(ctx.t("button.cancel"), "cancel");

    await ctx.wizard.state.message?.editText(ctx.t("change-unit.ask", { current: ctx.t(currentUnit) }), {
      reply_markup: keyboard,
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  // Шаг 1: Обрабатываем выбор и обновляем БД
  private handleUnit = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("change-unit.cancelled"), `account-${ctx.wizard.state.accountId}`)) return;

    const unit = ctx.wizard.state.unit ?? ctx.callbackQuery?.data;
    if (!unit) return;

    const area = ctx.wizard.state.area;
    const resource = ctx.wizard.state.account?.resource;
    const accountId = ctx.wizard.state.accountId;

    const needsArea = (resource === 'rent' && unit === 'unit.m2') || ((resource === 'garbage' || resource === 'other') && (unit === 'unit.m2' || unit === 'unit.person'));

    if (needsArea && !area) {
      ctx.wizard.state.unit = unit;
      return ctx.wizard.selectStep(ctx, 2);
    }

    try {
      const newArea = needsArea ? area : undefined;
      await Account.findByIdAndUpdate(accountId, { unit, area: newArea });
      const successUnitString = newArea ? `${ctx.t(unit)} (${newArea})` : ctx.t(unit);
      return this.abort(ctx, ctx.t("change-unit.success", { unit: successUnitString }), `account-${accountId}`);
    } catch (error) {
      return this.handleError(ctx, error, ctx.t("change-unit.error"), `account-${accountId}`);
    }
  };

  // Шаг 2: Запрашиваем площадь, если единица измерения м2
  private askArea = async (ctx: CallbackContext) => {
    const promptKey = (ctx.wizard.state.account?.resource === 'garbage' || ctx.wizard.state.account?.resource === 'other') && ctx.wizard.state.unit === 'unit.person' ? "create-account.ask-persons" : "create-account.ask-area";
    await ctx.wizard.state.message?.editText(ctx.t(promptKey), {
      reply_markup: new InlineKeyboard()
        .text(ctx.t("button.back"), "back")
        .text(ctx.t("button.cancel"), "cancel"),
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  }

  // Шаг 3: Обрабатываем площадь
  private handleArea = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-account.cancelled"))) return;

    if (ctx.callbackQuery?.data === "back") {
      return ctx.wizard.selectStep(ctx, 0); // Возврат к выбору единицы измерения
    }

    const area = parseFloat(ctx.msg?.text?.replace(",", ".") || "");
    if (isNaN(area) || area <= 0) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("error.invalid-number"), {
        reply_markup: new InlineKeyboard()
          .text(ctx.t("button.back"), "back")
          .text(ctx.t("button.cancel"), "cancel"),
        parse_mode: "HTML"
      });
      return;
    }

    await ctx.msg?.delete();
    ctx.wizard.state.area = area;
    return ctx.wizard.selectStep(ctx, 1);
  }
}