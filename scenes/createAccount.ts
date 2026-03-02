import { type CallbackContext, EResource, type TResourceType, type TStepHandler } from "@app-types/index.js";
import { Account, MeterType } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";


export default class CreateAccountScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "create-account");
  }

  get steps(): TStepHandler[] {
    return [
      this.askResource,
      this.handleResource,
      this.handleMeterType,
      this.askUnit,
      this.handleUnit,
      this.askCurrency,
      this.handleCurrency,
      this.handleAccountNumber
    ];
  }

  // Шаг 0: выбор ресурса
  private askResource = async (ctx: CallbackContext) => {
    await ctx.callbackQuery?.message?.editText(ctx.t("create-account.ask-resource"), {
      reply_markup: new InlineKeyboard()
        .text(ctx.t("resource.electricity"), EResource.electricity.name)
        .text(ctx.t("resource.heating"), EResource.heating.name).row()
        .text(ctx.t("resource.water"), EResource.water.name)
        .text(ctx.t("resource.gas"), EResource.gas.name).row()
        .text(ctx.t("resource.internet"), EResource.internet.name)
        .text(ctx.t("resource.garbage"), EResource.garbage.name).row()
        .text(ctx.t("resource.other"), EResource.other.name)
        .row()
        .text(ctx.t("button.cancel"), "cancel"), 
        parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  // Шаг 1: обработка ресурса
  private handleResource = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-account.cancelled"))) return;
    const resourceData = ctx.callbackQuery?.data;
    if (!resourceData || !(resourceData in EResource)) return;
    ctx.wizard.state.resource = resourceData as TResourceType;

    if (ctx.wizard.state.resource === EResource.electricity.name) {
      await ctx.callbackQuery?.message?.editText(ctx.t("create-account.ask-meter-type"), {
        reply_markup: new InlineKeyboard()
          .text(ctx.t("meter-type.single"), MeterType.SINGLE)
          .row()
          .text(ctx.t("meter-type.day-night"), MeterType.DAY_NIGHT)
          .row()
          .text(ctx.t("meter-type.multi-zone"), MeterType.MULTI_ZONE)
          .row()
          .text(ctx.t("button.back"), "back")
          .text(ctx.t("button.cancel"), "cancel"), 
          parse_mode: "HTML"
      });
      return ctx.wizard.next();
    }

    ctx.wizard.state.message = ctx.callbackQuery.message;
    return ctx.wizard.selectStep(ctx, 3); // переходим к выбору единицы измерения (index 3)
  };

  // Шаг 2: выбор типа счётчика (только для electricity)
  private handleMeterType = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-account.cancelled"))) return;

    if (ctx.callbackQuery?.data === "back") {
      return ctx.wizard.selectStep(ctx, 0); // Возврат к выбору ресурса
    }

    ctx.wizard.state.meterType = ctx.update.callback_query?.data as MeterType;

    ctx.wizard.state.message = ctx.callbackQuery?.message;
    return ctx.wizard.selectStep(ctx, 3); // переходим к выбору единицы измерения
  };

  // Шаг 3: выбор единицы измерения
  private askUnit = async (ctx: CallbackContext) => {
    const resource = ctx.wizard.state.resource;
    const units = EResource[resource!].units as readonly string[];

    // Если единица измерения только одна, выбираем её автоматически и идем дальше
    if (units.length === 1) {
      ctx.wizard.state.unit = units[0];
      return ctx.wizard.selectStep(ctx, 5); // перескакиваем на шаг выбора валюты
    }

    const keyboard = new InlineKeyboard();
    units.forEach((u) => keyboard.text(u, u).row());
    keyboard.text(ctx.t("button.back"), "back").text(ctx.t("button.cancel"), "cancel");

    await ctx.wizard.state.message?.editText(ctx.t("create-account.ask-unit", { emoji: EResource[resource!].emoji, resource: resource! }), {
      reply_markup: keyboard, 
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  // Шаг 4: обработка единицы измерения
  private handleUnit = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-account.cancelled"))) return;

    if (ctx.callbackQuery?.data === "back") {
      if (ctx.wizard.state.resource === EResource.electricity.name) {
        // Возврат к выбору счетчика
        await ctx.callbackQuery.message?.editText(ctx.t("create-account.ask-meter-type"), {
          reply_markup: new InlineKeyboard()
            .text(ctx.t("meter-type.single"), MeterType.SINGLE).row()
            .text(ctx.t("meter-type.day-night"), MeterType.DAY_NIGHT).row()
            .text(ctx.t("meter-type.multi-zone"), MeterType.MULTI_ZONE).row()
            .text(ctx.t("button.back"), "back").text(ctx.t("button.cancel"), "cancel"), 
            parse_mode: "HTML"
        });
        return ctx.wizard.selectStep(ctx, 2);
      } else {
        // Возврат к выбору ресурса
        return ctx.wizard.selectStep(ctx, 0);
      }
    }

    const unit = ctx.callbackQuery?.data;
    if (!unit) return;

    ctx.wizard.state.unit = unit;
    return ctx.wizard.selectStep(ctx, 5); // переходим к выбору валюты
  };

  // Шаг 5: выбор валюты
  private askCurrency = async (ctx: CallbackContext) => {
    await ctx.wizard.state.message?.editText(ctx.t("create-account.ask-currency"), {
      reply_markup: new InlineKeyboard()
        .text("🇺🇦 UAH", "UAH").text("🇺🇸 USD", "USD").text("🇪🇺 EUR", "EUR").row()
        .text("🇷🇺 RUB", "RUB").text("🇰🇿 KZT", "KZT").text("🇧🇾 BYN", "BYN").row()
        .text(ctx.t("button.back"), "back").text(ctx.t("button.cancel"), "cancel"), 
        parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  // Шаг 6: обработка валюты
  private handleCurrency = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-account.cancelled"))) return;

    // Обработка кнопки Назад
    if (ctx.callbackQuery?.data === "back") {
      const resource = ctx.wizard.state.resource;
      const units = EResource[resource!].units as readonly string[];

      // Если единиц несколько, возвращаемся к выбору единицы
      if (units.length > 1) {
        return ctx.wizard.selectStep(ctx, 3);
      } else {
        // Если единица была выбрана автоматически, пропускаем шаг назад
        if (resource === EResource.electricity.name) {
          await ctx.callbackQuery.message?.editText(ctx.t("create-account.ask-meter-type"), {
            reply_markup: new InlineKeyboard()
              .text(ctx.t("meter-type.single"), MeterType.SINGLE).row()
              .text(ctx.t("meter-type.day-night"), MeterType.DAY_NIGHT).row()
              .text(ctx.t("meter-type.multi-zone"), MeterType.MULTI_ZONE).row()
              .text(ctx.t("button.back"), "back").text(ctx.t("button.cancel"), "cancel"), 
              parse_mode: "HTML"
          });
          return ctx.wizard.selectStep(ctx, 2);
        } else {
          return ctx.wizard.selectStep(ctx, 0);
        }
      }
    }

    const currency = ctx.callbackQuery?.data;
    if (!currency) return;

    ctx.wizard.state.currency = currency;

    await ctx.callbackQuery?.message?.editText(
      ctx.t("create-account.ask-number", { currency }), { 
        reply_markup: new InlineKeyboard().text(ctx.t("button.back"), "back").text(ctx.t("button.cancel"), "cancel"),
        parse_mode: "HTML"
      }
    );
    return ctx.wizard.next();
  };

  // Шаг 7: ввод номера счёта
  private handleAccountNumber = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-account.cancelled"))) return;

    if (ctx.callbackQuery?.data === "back") {
      return ctx.wizard.selectStep(ctx, 5); // Возврат к выбору валюты
    }

    if (!ctx.update.message?.text) {
      await ctx.wizard.state.message!.editText(
        ctx.t("create-account.ask-number-text"), {
        reply_markup: new InlineKeyboard().text(ctx.t("button.back"), "back").text(ctx.t("button.cancel"), "cancel"), 
        parse_mode: "HTML"
      }
      );
      return
    }

    const accountNumber = ctx.update.message?.text;
    const resource = ctx.wizard.state.resource!;
    const meterType = ctx.wizard.state.meterType;
    const addressId = ctx.wizard.state.addressId;
    const currency = ctx.wizard.state.currency || "UAH";
    const unit = ctx.wizard.state.unit || EResource[resource!].units[0];

    await ctx.update.message?.delete().catch(() => { });

    try {
      await Account.create({
        account_number: accountNumber,
        resource,
        address_id: addressId,
        meterType,
        currency,
        unit
      });

      await this.abort(ctx, ctx.t("create-account.success", {
        account: accountNumber,
        emoji: EResource[resource!].emoji,
        resource,
        meter: meterType ? ", " + ctx.t("create-account.meter-label") + ": " + meterType : ""
      }), `address-${addressId}`);
    } catch (error) {
      return this.handleError(ctx, error, ctx.t("create-account.error"), `address-${addressId}`);
    }
  };
}
