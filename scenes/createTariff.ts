import { type CallbackContext, type TStepHandler, EResource } from "@app-types/index.js";
import { Account, Tariff, type ZoneParams, MeterType } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";

const cancelBtn = (ctx: CallbackContext) => new InlineKeyboard().text(ctx.t("button.cancel"), "cancel");

export default class CreateTariffScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "create-tariff");
  }

  get steps(): TStepHandler[] {
    return [
      this.askDate,
      this.handleDateAndAskFirstPrice,
      this.handleFirstPrice,
      this.handleSecondPrice,
      this.handleThirdPrice,
    ];
  }

  // Шаг 0: Выбор даты (год/месяц)
  private askDate = async (ctx: CallbackContext) => {
    const accountId = ctx.wizard.state.accountId;
    if (!accountId) {
      await this.abort(ctx, ctx.t("error.no-account-id"));
      return;
    }

    ctx.wizard.state.message = ctx.callbackQuery?.message;
    const currentYear = new Date().getFullYear();
    ctx.wizard.state.selectedYear = currentYear;

    await ctx.wizard.state.message?.editText(
      ctx.t("create-tariff.ask-date", { year: currentYear }), {
        reply_markup: this.makeYearMonthKeyboard(currentYear),
        parse_mode: "HTML"
      }
    );
    return ctx.wizard.next();
  };

  // Шаг 1: Обработка даты и запрос первой цены
  private handleDateAndAskFirstPrice = async (ctx: CallbackContext) => {
    // Навигация по годам
    const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
    if (yearData) {
      ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
      await ctx.callbackQuery?.message?.editText(
        ctx.t("create-tariff.ask-date", { year: ctx.wizard.state.selectedYear }), {
          reply_markup: this.makeYearMonthKeyboard(ctx.wizard.state.selectedYear), 
          parse_mode: "HTML"
        },
      );
      return; // Остаемся на этом шаге
    }

    // Выбор месяца
    const monthData = ctx.callbackQuery?.data?.match(/^select-month-(\d{4})-(\d{1,2})$/);
    if (monthData) {
      const year = parseInt(monthData[1], 10);
      const month = parseInt(monthData[2], 10);

      // Устанавливаем дату начала (1 число выбранного месяца)
      ctx.wizard.state.startDate = new Date(year, month - 1, 1);

      const accountId = ctx.wizard.state.accountId;
      const account = await Account.findById(accountId);
      if (!account) {
        await this.abort(ctx, ctx.t("error.account-not-found"));
        return;
      }

      // Определяем тип счетчика
      const type = account.meterType || MeterType.SINGLE;

      ctx.wizard.state.type = type;
      ctx.wizard.state.zones = [];
      const curr = account.currency;
      const unit = account.unit || EResource[account.resource].units[0];

      const prompt = type === MeterType.SINGLE
        ? ctx.t("create-tariff.ask-price", { curr, unit })
        : type === MeterType.DAY_NIGHT
          ? ctx.t("create-tariff.ask-price-day", { curr, unit })
          : type === MeterType.MULTI_ZONE
            ? ctx.t("create-tariff.ask-price-peak", { curr, unit })
            : "Ошибка определения типа счетчика.";

      await ctx.callbackQuery?.message?.editText(prompt, { reply_markup: cancelBtn(ctx) });
      return ctx.wizard.next();
    }
  };

  // Шаг 2: ввод первой цены
  private handleFirstPrice = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-tariff.cancelled"), `tariffs-${ctx.wizard.state.accountId}`)) return;

    if (!ctx.msg?.text) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("error.invalid-number"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return;
    }

    const price = parseFloat(ctx.msg?.text.replace(",", "."));
    if (isNaN(price) || price < 0) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("error.invalid-number"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return;
    }

    await ctx.msg?.delete();
    const type = ctx.wizard.state.type;

    if (type === MeterType.SINGLE) {
      ctx.wizard.state.zones = [{ name: "standard", price }];
      return this.saveTariff(ctx);
    }

    if (type === MeterType.DAY_NIGHT) {
      ctx.wizard.state.zones = [{ name: "day", price }];
      const account = await Account.findById(ctx.wizard.state.accountId);
      const unit = account?.unit || EResource[account!.resource].units[0];
      await ctx.wizard.state.message?.editText(ctx.t("create-tariff.ask-price-night", { curr: account!.currency, unit }), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return ctx.wizard.next();
    }

    if (type === MeterType.MULTI_ZONE) {
      ctx.wizard.state.zones = [{ name: "peak", price }];
      const account = await Account.findById(ctx.wizard.state.accountId);
      const unit = account?.unit || EResource[account!.resource].units[0];
      await ctx.wizard.state.message?.editText(ctx.t("create-tariff.ask-price-half-peak", { curr: account!.currency, unit }), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return ctx.wizard.next();
    }
  };

  // Шаг 3: ввод второй цены
  private handleSecondPrice = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-tariff.cancelled"), `tariffs-${ctx.wizard.state.accountId}`)) return;

    const price = parseFloat(ctx.msg?.text?.replace(",", ".") || "");
    if (isNaN(price) || price < 0) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("error.invalid-number"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return;
    }

    await ctx.msg?.delete();
    const type = ctx.wizard.state.type;

    if (type === MeterType.DAY_NIGHT) {
      ctx.wizard.state.zones.push({ name: "night", price });
      return this.saveTariff(ctx);
    }

    if (type === MeterType.MULTI_ZONE) {
      ctx.wizard.state.zones.push({ name: "half-peak", price });
      const account = await Account.findById(ctx.wizard.state.accountId);
      const unit = account?.unit || EResource[account!.resource].units[0];
      await ctx.wizard.state.message?.editText(ctx.t("create-tariff.ask-price-night", { curr: account!.currency, unit }), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return ctx.wizard.next();
    }
  };

  // Шаг 4: ввод третьей цены (multi-zone)
  private handleThirdPrice = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-tariff.cancelled"), `tariffs-${ctx.wizard.state.accountId}`)) return;

    const price = parseFloat(ctx.msg?.text?.replace(",", ".") || "");
    if (isNaN(price) || price < 0) {
      if (ctx.msg) await ctx.msg.delete();
      await ctx.wizard.state.message?.editText(ctx.t("error.invalid-number"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return;
    }

    await ctx.msg?.delete();
    ctx.wizard.state.zones.push({ name: "night", price });
    return this.saveTariff(ctx);
  };

  // Функция сохранения тарифа
  private saveTariff = async (ctx: CallbackContext) => {
    try {
      await Tariff.create({
        account_id: ctx.wizard.state.accountId,
        type: ctx.wizard.state.type,
        zones: ctx.wizard.state.zones,
        startDate: ctx.wizard.state.startDate,
      });

      if (ctx.update.message) await ctx.update.message.delete().catch(() => { });
      else if (ctx.msg) await ctx.msg.delete().catch(() => { });

      const account = await Account.findById(ctx.wizard.state.accountId);
      const title = ctx.t("create-tariff.success", { zones: ctx.wizard.state.zones.map((z: ZoneParams) => `${z.name}: ${z.price.toLocaleString("ru-RU", { currencyDisplay: "symbol", style: "currency", currency: account?.currency || "UAH", minimumFractionDigits: 2 })}`).join("\n") });
      return this.abort(ctx, title, `tariffs-${ctx.wizard.state.accountId}`);

    } catch (error) {
      return this.handleError(ctx, error, ctx.t("create-tariff.error"), `tariffs-${ctx.wizard.state.accountId}`);
    }
  };
}
