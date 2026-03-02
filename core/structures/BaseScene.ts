import type BotClient from "@core/Client.js";
import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { InlineKeyboard } from "grammy";


/**
* Базовый класс для сцен
*/
export abstract class BaseScene {
  protected client: BotClient;
  public name: string;

  constructor(client: BotClient, name: string) {
    this.client = client;
    this.name = name;
  }

  // Геттер должен возвращать массив функций-шагов
  abstract get steps(): TStepHandler[];

  protected async backToMenu(ctx: CallbackContext, text: string, menuName: string = "main-menu") {
    const keyboard = new InlineKeyboard().text(ctx.t("button.back"), menuName)
    if (ctx.wizard.state.message && ctx.wizard.state.message.text) {
      await ctx.wizard.state.message.editText(text, { reply_markup: keyboard, parse_mode: "HTML" });
      return
    }
    if (ctx.update && ctx.update.message && ctx.update.message.text) {
      await ctx.update.message.editText(text, { reply_markup: keyboard, parse_mode: "HTML" });
      return
    }
    await ctx.callbackQuery.message?.editText(text, { reply_markup: keyboard.text(ctx.t("button.home"), "main-menu"), parse_mode: "HTML" });
  }

  /**
   * Завершает сцену и возвращает пользователя в меню
   * @param ctx Контекст
   * @param text Текст сообщения
   * @param menu Имя меню для возврата (по умолчанию main-menu)
   * @returns 
   */
  protected async abort(ctx: CallbackContext, text: string = "❌ Action aborted.", menu: string = "main-menu"): Promise<void> {
    await this.backToMenu(ctx, text, menu);
    return ctx.scene.leave();
  }

  /**
   * Проверяет, была ли нажата кнопка отмены.
   * Если да — завершает сцену.
   * @param ctx Контекст
   * @param text Текст сообщения
   * @param menu Имя меню для возврата (по умолчанию main-menu)
   * @returns true, если сцена была отменена (нужно прервать выполнение шага)
   */
  protected async checkCancel(ctx: CallbackContext, text?: string, menu?: string): Promise<boolean> {
    if (ctx.callbackQuery?.data === "cancel" || ctx.update.callback_query?.data === "cancel") {
      await this.abort(ctx, text, menu);
      return true;
    }
    return false;
  }

  protected async confirmOrCancel(ctx: CallbackContext, text: string) {
    return ctx.callbackQuery.message?.editText(text, {
      reply_markup: new InlineKeyboard()
        .text(ctx.t("button.delete"), "confirm").danger()
        .text(ctx.t("button.cancel"), "cancel"), 
      parse_mode: "HTML"
    });
  }

  /**
   * Обрабатывает ошибку: логирует её и выводит сообщение пользователю.
   * Возвращает пользователя в меню и завершает сцену.
   * @param ctx Контекст
   * @param error Содержимое ошибки для отображения в консоли
   * @param text Текст, выводимый пользователю
   * @param menu Имя меню для возврата (по умолчанию main-menu)
   */
  protected async handleError(ctx: CallbackContext, error: unknown, text: string = "❌ Error occurred.", menu: string = "main-menu"): Promise<void> {
    console.error(`[Scene: ${this.name}] Error:`, error);
    return this.abort(ctx, text, menu);
  }

  protected makeYearMonthKeyboard(selectedYear: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
  
    // месяцы
    for (let m = 1; m <= 12; m++) {
      if (m === currentMonth && selectedYear === currentYear) keyboard.text(`${m}`, `select-month-${selectedYear}-${m}`).primary();
      else keyboard.text(`${m}`, `select-month-${selectedYear}-${m}`);
      if (m % 3 === 0) keyboard.row();
    }
    // годы: выбранный год всегда в центре
    const years = [selectedYear - 1, selectedYear, selectedYear + 1];
    years.forEach((y) => {
      if (y === selectedYear) {
        keyboard.text(`${y}`, `select-year-${y}`).primary();
      } else if (y < selectedYear) {
        keyboard.text(`⬅️ ${y}`, `select-year-${y}`);
      } else {
        keyboard.text(`${y} ➡️`, `select-year-${y}`);
      }
    });
    return keyboard;
  }
}
