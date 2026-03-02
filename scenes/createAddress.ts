import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { BaseScene } from "@structures/index.js";
import { Address, UserAddress } from "@models/index.js";
import { Types } from "mongoose";
import { InlineKeyboard } from "grammy";
import type BotClient from "@core/Client";

const cancelBtn = (ctx: CallbackContext) => new InlineKeyboard().text(ctx.t("button.cancel"), "cancel");

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
    const title = ctx.t("create-address.ask");
    await ctx.wizard.state.message.editText(title, { reply_markup: cancelBtn(ctx), parse_mode: "HTML" });
    return ctx.wizard.next();
  }

  // Шаг 1: сохранение адреса
  private handleAddress = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, ctx.t("create-address.cancelled"))) return;
    if (!ctx.msg?.text) {
      await ctx.wizard.state.message?.editText(ctx.t("create-address.error-text-required"), {
        reply_markup: cancelBtn(ctx), 
        parse_mode: "HTML"
      });
      return
    }

    const addressName = ctx.msg.text;
    await ctx.msg.delete().catch(() => { });

    const telegramId = ctx.from?.id;
    if (!telegramId) return this.abort(ctx, ctx.t("error.no-telegram-id"));

    try {
      let address;
      // Clean the input to handle invisible characters from copy-pasting, then check if it's a valid ID
      const cleanedInput = addressName.replace(/[\u200B-\u200D\uFEFF\u2060-\u206F]/g, '').trim();

      if (Types.ObjectId.isValid(cleanedInput)) {
        address = await Address.findById(cleanedInput);
      }

      if (address) {
        // Address was found by ID. Check if user is already linked.
        const userAddress = await UserAddress.findOne({ telegram_id: telegramId, address_id: address._id });
        if (userAddress) {
          return this.abort(ctx, ctx.t("create-address.already-exists", { address: address.name }), "utilities-menu");
        }
      } else {
        // Input was not a valid/existing ID. Treat the original input as a name for a new address.
        address = await Address.create({ name: addressName, ownerId: telegramId });
      }

      await UserAddress.create({
        telegram_id: telegramId,
        address_id: address._id,
      });

      return this.abort(ctx, ctx.t("create-address.success", { address: address.name }), "utilities-menu");
    } catch (error) {
      console.error(error);
      return this.handleError(ctx, error, ctx.t("create-address.error"));
    }
  }
};
