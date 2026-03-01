import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { BaseScene } from "@structures/index.js";
import { Address, UserAddress } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import type BotClient from "@core/Client";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

export default class CreateAddressScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "create-address");
  }

  get steps(): TStepHandler[] {
    return [
      this.askAddress,
      this.handleAddress,
    ]
  }

  /**
   * Шаг 0: Инициализация ввода адреса.
   *
   * Метод сохраняет текущее сообщение (из которого был вызван callback) в состояние сцены,
   * чтобы в дальнейшем редактировать его при ошибках или успешном завершении.
   * Затем изменяет текст сообщения на запрос ввода адреса и переводит визард на следующий шаг.
   *
   * @param ctx - Контекст выполнения, содержащий информацию о callback-запросе и состоянии сцены.
   * @returns Promise<void> - Возвращает результат перехода к следующему шагу.
   */
  private askAddress = async (ctx: CallbackContext) => {
    ctx.wizard.state.message = ctx.callbackQuery.message;
    if (!ctx.wizard.state.message) return
    const title = "Введите адрес строкой (например: г. Киев, ул. Крещатик, д. 1, кв. 10):"
    await ctx.wizard.state.message.editText(title, { reply_markup: cancelBtn });
    return ctx.wizard.next();
  }

  // Шаг 1: сохранение адреса
  private handleAddress = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Создание адреса отменено.")) return;
    if (!ctx.msg?.text) {
      await ctx.wizard.state.message?.editText("❌ Пожалуйста, введите адрес строкой.", { 
        reply_markup: cancelBtn 
      });
      return
    }

    const addressName = ctx.msg.text;
    await ctx.msg.delete().catch(() => { });

    const telegramId = ctx.from?.id;
    if (!telegramId) return this.abort(ctx, "❌ Ошибка: не удалось получить ваш Telegram ID.");

    try {
      let address = await Address.findOne({ name: addressName });
      if (!address) {
        address = await Address.create({
          name: addressName,
        });
      }

      await UserAddress.create({
        telegram_id: telegramId,
        address_id: address._id,
      });

      return this.abort(ctx, `✅ Адрес 🏠 ${addressName} успешно добавлен.`);
    } catch (error) {
      console.error(error);
      return this.handleError(ctx, error, "❌ Ошибка при добавлении адреса.");
    }
  }
};
