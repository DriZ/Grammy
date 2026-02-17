import { CallbackContext, WizardScene } from "../types/index.js";
import { Account, MeterType } from "../models/index.js";
import { InlineKeyboard } from "grammy";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

const createAccountScene: WizardScene<CallbackContext> = {
  name: "create-account",
  steps: [
    // Шаг 0: выбор ресурса
    async (ctx) => {
      await ctx.callbackQuery?.message?.editText("Выберите тип ресурса:", {
        reply_markup: new InlineKeyboard()
          .text("⚡ Электричество", "electricity").row()
          .text("💧 Вода", "water").row()
          .text("🔥 Газ", "gas").row()
          .text("Отмена", "cancel"),
      });
      return ctx.wizard.next();
    },

    // Шаг 1: обработка ресурса
    async (ctx) => {
      if (ctx.callbackQuery?.data === "cancel") {
        await ctx.callbackQuery.message?.delete();
        return ctx.scene.leave();
      }

      ctx.wizard.state.resource = ctx.update.callback_query?.data;

      if (ctx.wizard.state.resource === "electricity") {
        // если электричество → спрашиваем тип счётчика
        await ctx.callbackQuery?.message?.editText("Выберите тип счётчика:", {
          reply_markup: new InlineKeyboard()
            .text("Однотарифный", MeterType.SINGLE).row()
            .text("День/Ночь", MeterType.DAY_NIGHT).row()
            .text("Пик/Полупик/Ночь", MeterType.MULTI_ZONE).row()
            .text("Отмена", "cancel"),
        });
        return ctx.wizard.next();
      }

      // если вода/газ → сразу спрашиваем номер счёта
      await ctx.callbackQuery?.message?.editText(
        `Тип ресурса: ${ctx.wizard.state.resource}\n\nВведите номер счёта:`,
        { reply_markup: cancelBtn }
      );
      ctx.wizard.state.message = ctx.callbackQuery?.message;
      return ctx.wizard.selectStep(ctx, 3); // перескакиваем на шаг ввода номера
    },

    // Шаг 2: выбор типа счётчика (только для electricity)
    async (ctx) => {
      if (ctx.callbackQuery?.data === "cancel") {
        await ctx.callbackQuery.message?.delete();
        return ctx.scene.leave();
      }

      ctx.wizard.state.meterType = ctx.update.callback_query?.data;

      await ctx.callbackQuery?.message?.editText(
        `Ресурс: ${ctx.wizard.state.resource}, счётчик: ${ctx.wizard.state.meterType}\n\nВведите номер счёта:`,
        { reply_markup: cancelBtn }
      );
      ctx.wizard.state.message = ctx.callbackQuery?.message;
      return ctx.wizard.next();
    },

    // Шаг 3: ввод номера счёта
    async (ctx) => {
      if (ctx.update.callback_query?.data === "cancel") {
        await ctx.update.callback_query.message?.delete();
        return ctx.scene.leave();
      }

      if (!ctx.update.message?.text) {
        await ctx.wizard.state.message?.editText("Пожалуйста, введите текст.");
        return ctx.wizard.back();
      }

      const accountNumber = ctx.update.message?.text;
      const resource = ctx.wizard.state.resource;
      const meterType = ctx.wizard.state.meterType;
      const addressId = ctx.wizard.params.addressId;

      await ctx.update.message?.delete();

      try {
        await Account.create({
          account_number: accountNumber,
          resource,
          address_id: addressId,
          meterType, // сохраняем тип счётчика, если есть
        });

        await ctx.wizard.state.message?.editText(
          `✅ Счёт ${accountNumber} (${resource}${meterType ? ", " + meterType : ""}) создан.`,
          { reply_markup: new InlineKeyboard().text("⬅️ Назад", "utilities-menu") }
        );
      } catch (error) {
        console.error(error);
        await ctx.wizard.state.message?.editText("❌ Ошибка при создании счёта.");
      }
      return ctx.scene.leave();
    },
  ],
};

export default createAccountScene;
