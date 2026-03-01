import type { CallbackContext, TStepHandler } from "@app-types/index.js";
import { UtilitiesReading, Tariff, Account, type IAccount, FixedFee } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { EResource } from "@app-types/index.js";

export default class CalculateBillScene extends BaseScene {
  constructor(client: BotClient) {
    super(client, "calculate-bill");
  }

  get steps(): TStepHandler[] {
    return [this.askYear, this.handleDateSelection];
  }

  // Шаг 0: Показать выбор года/месяца
  private askYear = async (ctx: CallbackContext) => {
    const { accountId, addressId } = ctx.wizard.state;
    if (!accountId && !addressId) return this.abort(ctx, "❌ Ошибка: не указан ID счета или адреса.");

    ctx.wizard.state.message = ctx.callbackQuery?.message;
    const currentYear = new Date().getFullYear();
    ctx.wizard.state.selectedYear = currentYear;

    const text = accountId
      ? `📅 Выберите месяц для расчета (${currentYear}):`
      : `📅 Выберите месяц для расчета по всем счетам адреса (${currentYear}):`;

    await ctx.wizard.state.message?.editText(text, {
      reply_markup: ctx.utils.makeYearMonthKeyboard(currentYear),
    });
    return ctx.wizard.next();
  }

  // Шаг 1: Обработать выбор и рассчитать
  private handleDateSelection = async (ctx: CallbackContext) => {
    // Навигация по годам
    const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
    if (yearData) {
      ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
      const title = `📅 Выберите месяц для расчета (${ctx.wizard.state.selectedYear}):`;
      await ctx.callbackQuery?.message?.editText(title, {
        reply_markup: ctx.utils.makeYearMonthKeyboard(ctx.wizard.state.selectedYear)
      });
      return; // Остаемся на этом шаге
    }

    // Выбор месяца
    const monthData = ctx.callbackQuery?.data?.match(/^select-month-(\d{4})-(\d{1,2})$/);
    if (!monthData) return;

    const year = parseInt(monthData[1], 10);
    const month = parseInt(monthData[2], 10);
    const { accountId, addressId } = ctx.wizard.state;

    if (accountId) {
      const account = await Account.findById(accountId);
      if (!account) return this.abort(ctx, "❌ Счет не найден.");

      const result = await this.getBillForAccount(account, year, month);

      if (!result.success) {
        return this.abort(ctx, `❌ ${result.error}`, `account-${accountId}`);
      }

      const resultText = [
        `🧾 Расчет по счету **${account.account_number}** за **${month.toString().padStart(2, "0")}.${year}**`,
        ...result.lines,
        "---",
        `**ИТОГО К ОПЛАТЕ: ${result.totalCost.toLocaleString("ru-RU", { style: "currency", currency: account.currency })}**`
      ].join("\n");

      await ctx.wizard.state.message!.editText(resultText, {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().text("⬅️ Назад", `account-${accountId}`),
      });

    } else if (addressId) {
      const accounts = await Account.find({ address_id: addressId });
      if (accounts.length === 0) {
        return this.abort(ctx, "❌ По этому адресу нет счетов.", `address-${addressId}`);
      }

      // Группируем итоги по валютам
      const grandTotals: Record<string, number> = {};
      const allResults: string[] = [`🧾 Сводный расчет за **${month.toString().padStart(2, "0")}.${year}**\n`];

      for (const account of accounts) {
        const result = await this.getBillForAccount(account, year, month);

        if (result.success) {
          grandTotals[account.currency] = (grandTotals[account.currency] || 0) + result.totalCost;
          allResults.push(`**Счет ${account.account_number} (${EResource[account.resource].emoji})**`);
          allResults.push(...result.lines);
          allResults.push(`  - **Итог по счету: ${result.totalCost.toLocaleString("ru-RU", { style: "currency", currency: account.currency })}**`);
          allResults.push("---");
        } else {
          allResults.push(`**Счет ${account.account_number} (${EResource[account.resource].emoji})**`);
          allResults.push(`  - ⚠️ ${result.error}`);
          allResults.push("---");
        }
      }

      const totalStrings = Object.entries(grandTotals).map(([curr, amount]) => amount.toLocaleString("ru-RU", { style: "currency", currency: curr }));
      allResults.push(`**💰 ОБЩИЙ ИТОГ: ${totalStrings.join(" + ")}**`);

      await ctx.wizard.state.message!.editText(allResults.join("\n"), {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().text("⬅️ Назад", `address-${addressId}`),
      });
    } else {
      return this.abort(ctx, "❌ Ошибка: не указан ID счета или адреса.");
    }

    return ctx.scene.leave();
  }

  private async getBillForAccount(account: IAccount, year: number, month: number): Promise<{ success: true, lines: string[], totalCost: number } | { success: false, error: string }> {
    const { _id: accountId } = account;

    const currentReading = await UtilitiesReading.findOne({ account_id: accountId, year, month });
    if (!currentReading) return { success: false, error: `Показания не найдены` };

    const prevMonthDate = new Date(year, month - 1, 1);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;

    const previousReading = await UtilitiesReading.findOne({ account_id: accountId, year: prevYear, month: prevMonth });
    if (!previousReading) {
      return { success: false, error: `Не найдены показания за предыдущий месяц (${prevMonth}.${prevYear})` };
    }

    const readingDate = new Date(year, month - 1, 1);
    const tariff = await Tariff.findOne({ account_id: accountId, startDate: { $lte: readingDate } }).sort({ startDate: -1 });
    if (!tariff) return { success: false, error: `Не найден действующий тариф` };

    let totalCost = 0;
    const resultLines: string[] = [];

    for (const currentZone of currentReading.zones) {
      const prevZone = previousReading.zones.find((z) => z.name === currentZone.name);
      const tariffZone = tariff.zones.find((z) => z.name === currentZone.name);

      if (!prevZone || !tariffZone) continue;

      const consumption = currentZone.value - prevZone.value;
      if (consumption < 0) return { success: false, error: `Отрицательное потребление для зоны "${currentZone.name}"` };

      const cost = consumption * tariffZone.price;
      totalCost += cost;

      const unit = account.unit || EResource[account.resource].units[0];

      resultLines.push(`  - Зона "${currentZone.name}": ${consumption} ${unit} x ${tariffZone.price.toLocaleString("ru-RU", { style: "currency", currency: account.currency })} = **${cost.toLocaleString("ru-RU", { style: "currency", currency: account.currency })}**`);
    }

    // 5. Добавляем абонплату (FixedFee)
    const fixedFee = await FixedFee.findOne({ account_id: accountId, startDate: { $lte: readingDate } }).sort({ startDate: -1 });
    if (fixedFee) {
      totalCost += fixedFee.amount;
      resultLines.push(`  - ➕ Абонплата: **${fixedFee.amount.toLocaleString("ru-RU", { style: "currency", currency: account.currency })}**`);
    }

    return { success: true, lines: resultLines, totalCost };
  }
};
