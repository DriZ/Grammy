import { type CallbackContext, type TStepHandler } from "@app-types/index.js";
import { FixedFee } from "@models/index.js";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";

export default class DeleteFixedFeeScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "delete-fixedfee");
  }
  get steps(): TStepHandler[] {
    return [this.askDeletion, this.handleDeletion];
  }

  private askDeletion = async (ctx: CallbackContext) => {
    const feeId = ctx.wizard.state.fixedFeeId;
    if (!feeId) return this.abort(ctx, "❌ Ошибка: ID не найден.");

    const fee = await FixedFee.findById(feeId);
    if (!fee) return this.abort(ctx, "❌ Запись не найдена.");

    ctx.wizard.state.accountId = fee.account_id.toString();
    await this.confirmOrCancel(ctx, `Удалить абонплату ${fee.amount} грн?`);
    return ctx.wizard.next();
  }

  private handleDeletion = async (ctx: CallbackContext) => {
    if (await this.checkCancel(ctx, "❌ Отменено.", `fixed-fee-${ctx.wizard.state.fixedFeeId}`)) return;
    if (ctx.callbackQuery?.data === "confirm") {
      await FixedFee.findByIdAndDelete(ctx.wizard.state.fixedFeeId);
      const parentMenu = `fixed-fees-${ctx.wizard.state.accountId}`;
      ctx.services.menuManager.cleanupForDeletion(ctx, `fixed-fee-${ctx.wizard.state.fixedFeeId}`, parentMenu);
      return this.abort(ctx, "✅ Удалено.", parentMenu);
    }
  }
}
