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
    await ctx.callbackQuery?.message?.editText("Выберите тип ресурса:", {
      reply_markup: new InlineKeyboard()
        .text("⚡ Электричество", EResource.electricity.name)
        .text("🌡️ Отопление", EResource.heating.name).row()
        .text("💧 Вода", EResource.water.name)
        .text("🔥 Газ", EResource.gas.name).row()
        .text("🌐 Интернет", EResource.internet.name)
        .text("🗑️ Мусор", EResource.garbage.name).row()
        .text("📦 Другое", EResource.other.name)
        .row()
        .text("Отмена", "cancel"),
    });
    return ctx.wizard.next();
  };

  // Шаг 1: обработка ресурса
  private handleResource = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;
    const resourceData = ctx.callbackQuery?.data;
    if (!resourceData || !(resourceData in EResource)) return;
    ctx.wizard.state.resource = resourceData as TResourceType;

    if (ctx.wizard.state.resource === EResource.electricity.name) {
      await ctx.callbackQuery?.message?.editText("Выберите тип счётчика:", {
        reply_markup: new InlineKeyboard()
          .text("Однотарифный", MeterType.SINGLE)
          .row()
          .text("День/Ночь", MeterType.DAY_NIGHT)
          .row()
          .text("Пик/Полупик/Ночь", MeterType.MULTI_ZONE)
          .row()
          .text("⬅️ Назад", "back")
          .text("Отмена", "cancel"),
      });
      return ctx.wizard.next();
    }

    ctx.wizard.state.message = ctx.callbackQuery.message;
    return ctx.wizard.selectStep(ctx, 3); // переходим к выбору единицы измерения (index 3)
  };

  // Шаг 2: выбор типа счётчика (только для electricity)
  private handleMeterType = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;

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
    keyboard.text("⬅️ Назад", "back").text("Отмена", "cancel");

    await ctx.wizard.state.message?.editText(`Выберите единицу измерения для ${EResource[resource!].emoji} ${resource}:`, {
      reply_markup: keyboard,
    });
    return ctx.wizard.next();
  };

  // Шаг 4: обработка единицы измерения
  private handleUnit = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;

    if (ctx.callbackQuery?.data === "back") {
      if (ctx.wizard.state.resource === EResource.electricity.name) {
        // Возврат к выбору счетчика
        await ctx.callbackQuery.message?.editText("Выберите тип счётчика:", {
          reply_markup: new InlineKeyboard()
            .text("Однотарифный", MeterType.SINGLE).row()
            .text("День/Ночь", MeterType.DAY_NIGHT).row()
            .text("Пик/Полупик/Ночь", MeterType.MULTI_ZONE).row()
            .text("⬅️ Назад", "back").text("Отмена", "cancel"),
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
    await ctx.wizard.state.message?.editText("Выберите валюту:", {
      reply_markup: new InlineKeyboard()
        .text("🇺🇦 UAH", "UAH").text("🇺🇸 USD", "USD").text("🇪🇺 EUR", "EUR").row()
        .text("🇷🇺 RUB", "RUB").text("🇰🇿 KZT", "KZT").text("🇧🇾 BYN", "BYN").row()
        .text("⬅️ Назад", "back").text("Отмена", "cancel"),
    });
    return ctx.wizard.next();
  };

  // Шаг 6: обработка валюты
  private handleCurrency = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;

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
          await ctx.callbackQuery.message?.editText("Выберите тип счётчика:", {
            reply_markup: new InlineKeyboard()
              .text("Однотарифный", MeterType.SINGLE).row()
              .text("День/Ночь", MeterType.DAY_NIGHT).row()
              .text("Пик/Полупик/Ночь", MeterType.MULTI_ZONE).row()
              .text("⬅️ Назад", "back").text("Отмена", "cancel"),
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
      `Валюта: ${currency}\n\nВведите номер счёта:`,
      { reply_markup: new InlineKeyboard().text("⬅️ Назад", "back").text("Отмена", "cancel") },
    );
    return ctx.wizard.next();
  };

  // Шаг 7: ввод номера счёта
  private handleAccountNumber = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;

    if (ctx.callbackQuery?.data === "back") {
      return ctx.wizard.selectStep(ctx, 5); // Возврат к выбору валюты
    }

    if (!ctx.update.message?.text) {
      await ctx.wizard.state.message!.editText(
        `Введите номер счёта текстом:`, {
        reply_markup: new InlineKeyboard().text("⬅️ Назад", "back").text("Отмена", "cancel")
      }
      );
      return
    }

    const accountNumber = ctx.update.message?.text;
    const resource = ctx.wizard.state.resource;
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

      await this.abort(ctx, `✅ Счёт ${accountNumber} (${EResource[resource!].emoji} ${resource}${meterType ? ", счётчик: " + meterType : ""}) успешно добавлен.`, `address-${addressId}`);
    } catch (error) {
      return this.handleError(ctx, error, "❌ Ошибка при создании счёта.", `address-${addressId}`);
    }
  };
}
