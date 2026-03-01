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
      await ctx.wizard.state.message.editText(text, { reply_markup: keyboard });
      return
    }
    if (ctx.update && ctx.update.message && ctx.update.message.text) {
      await ctx.update.message.editText(text, { reply_markup: keyboard });
      return
    }
    await ctx.callbackQuery.message?.editText(text, { reply_markup: keyboard });
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
}
