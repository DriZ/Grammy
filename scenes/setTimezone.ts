import type { CallbackContext, SessionContext, TStepHandler } from "@app-types/index.js";
import { User } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";
import { find } from "geo-tz";


const cancelBtn = (ctx: CallbackContext) => new InlineKeyboard().text(ctx.t("button.cancel"), "cancel");

export default class SetTimezoneScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "set-timezone");
  }

  get steps(): TStepHandler[] {
    return [
      this.askTimezone,
      this.handleTimezone,
    ];
  }

  private askTimezone = async (ctx: SessionContext) => {
    ctx.wizard.state.message = ctx.callbackQuery?.message;

    // Создаем клавиатуру с популярными зонами и кнопкой геолокации
    const keyboard = new InlineKeyboard()
      .text("📍 " + ctx.t("button.location"), "req-location").row()
      .text("UTC-12:00", "tz-Etc/GMT+12").text("UTC-11:00", "tz-Etc/GMT+11").row()
      .text("UTC-10:00", "tz-Etc/GMT+10").text("UTC-09:00", "tz-Etc/GMT+9").row()
      .text("UTC-08:00", "tz-Etc/GMT+8").text("UTC-07:00", "tz-Etc/GMT+7").row()
      .text("UTC-06:00", "tz-Etc/GMT+6").text("UTC-05:00", "tz-Etc/GMT+5").row()
      .text("UTC-04:00", "tz-Etc/GMT+4").text("UTC-03:00", "tz-Etc/GMT+3").row()
      .text("UTC-02:00", "tz-Etc/GMT+2").text("UTC-01:00", "tz-Etc/GMT+1").row()
      .text("UTC+00:00", "tz-Etc/GMT").row()
      .text("UTC+01:00", "tz-Etc/GMT-1").text("UTC+02:00", "tz-Etc/GMT-2").row()
      .text("UTC+03:00", "tz-Etc/GMT-3").text("UTC+04:00", "tz-Etc/GMT-4").row()
      .text("UTC+05:00", "tz-Etc/GMT-5").text("UTC+06:00", "tz-Etc/GMT-6").row()
      .text("UTC+07:00", "tz-Etc/GMT-7").text("UTC+08:00", "tz-Etc/GMT-8").row()
      .text("UTC+09:00", "tz-Etc/GMT-9").text("UTC+10:00", "tz-Etc/GMT-10").row()
      .text("UTC+11:00", "tz-Etc/GMT-11").text("UTC+12:00", "tz-Etc/GMT-12").row()
      .text(ctx.t("button.cancel"), "cancel");

    await ctx.wizard.state.message?.editText(ctx.t("set-timezone.ask"), {
      reply_markup: keyboard,
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  };

  private handleTimezone = async (ctx: SessionContext) => {
    if (await this.checkCancel(ctx as CallbackContext, ctx.t("set-timezone.cancelled"), "reminders-menu")) return;

    // Если нажали кнопку "Отправить геолокацию" (инлайн), просим пользователя отправить её через вложения
    if (ctx.callbackQuery?.data === "req-location") {
      await ctx.editMessageText(ctx.t("set-timezone.send-location"), { reply_markup: cancelBtn(ctx as CallbackContext), parse_mode: "HTML" });
      return; // Остаемся на этом шаге
    }

    let timezone: string | undefined;

    if (ctx.callbackQuery?.data?.startsWith("tz-")) {
      timezone = ctx.callbackQuery.data.replace("tz-", ""); // Например, "Etc/GMT-3"
    }

    // Обработка геолокации
    if (ctx.message?.location) {
      const { latitude, longitude } = ctx.message.location;
      const timezones = find(latitude, longitude);
      if (timezones && timezones.length > 0) {
        timezone = timezones[0];
      }
    }

    if (!timezone) return;

    try {
      // Простая валидация таймзоны
      Intl.DateTimeFormat(undefined, { timeZone: timezone });

      await User.findOneAndUpdate({ telegram_id: ctx.from?.id }, { timezone: timezone });

      // Удаляем сообщение только если это сообщение пользователя (не нажатие кнопки)
      if (!ctx.callbackQuery && ctx.msg) await ctx.msg.delete().catch(() => { });

      return this.abort(ctx as CallbackContext, ctx.t("set-timezone.success", { timezone: ctx.escapeHTML(timezone) }), "reminders-menu");
    } catch (e) {
      // Удаляем сообщение только если это сообщение пользователя
      if (!ctx.callbackQuery && ctx.msg) await ctx.msg.delete().catch(() => { });
      await ctx.wizard.state.message?.editText(ctx.t("set-timezone.error-invalid"), { parse_mode: "HTML" });
      return;
    }
  };
}
