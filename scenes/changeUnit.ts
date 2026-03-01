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
    ];
  }

  // Шаг 0: Показываем текущую единицу и предлагаем выбрать новую
  private askUnit = async (ctx: CallbackContext) => {
    const accountId = ctx.wizard.state.accountId;
    if (!accountId) return this.abort(ctx, "❌ Ошибка: не указан ID счета.");

    const account = await Account.findById(accountId);
    if (!account) return this.abort(ctx, "❌ Счет не найден.");

    ctx.wizard.state.message = ctx.callbackQuery?.message;

    const resource = account.resource;
    const units = EResource[resource].units;
    const currentUnit = account.unit || units[0];

    const keyboard = new InlineKeyboard();
    units.forEach((u) => {
      // Если это текущая единица, можно пометить её (опционально), но пока просто выводим список
      keyboard.text(u, u).row();
    });
    keyboard.text("Отмена", "cancel");

    await ctx.wizard.state.message?.editText(`Текущая единица измерения: ${currentUnit}\nВыберите новую:`, {
      reply_markup: keyboard,
    });
    return ctx.wizard.next();
  };

  // Шаг 1: Обрабатываем выбор и обновляем БД
  private handleUnit = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Изменение отменено.", `account-${ctx.wizard.state.accountId}`)) return;
    
    const unit = ctx.callbackQuery?.data;
    if (!unit) return;

    const accountId = ctx.wizard.state.accountId;
    
    try {
        await Account.findByIdAndUpdate(accountId, { unit });
        return this.abort(ctx, `✅ Единица измерения изменена на ${unit}.`, `account-${accountId}`);
    } catch (error) {
        return this.handleError(ctx, error, "❌ Ошибка при обновлении.", `account-${accountId}`);
    }
  };
}
