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
    if (!accountId && !addressId) return this.abort(ctx, ctx.t("calculate-bill.error-no-id"));

    ctx.wizard.state.message = ctx.callbackQuery?.message;
    const currentYear = new Date().getFullYear();
    ctx.wizard.state.selectedYear = currentYear;

    const text = accountId
      ? ctx.t("calculate-bill.ask-month", { year: currentYear })
      : ctx.t("calculate-bill.ask-month-address", { year: currentYear });

    await ctx.wizard.state.message?.editText(text, {
      reply_markup: this.makeYearMonthKeyboard(currentYear),
      parse_mode: "HTML"
    });
    return ctx.wizard.next();
  }

  // Шаг 1: Обработать выбор и рассчитать
  private handleDateSelection = async (ctx: CallbackContext) => {
    // Навигация по годам
    const yearData = ctx.callbackQuery?.data?.match(/^select-year-(\d{4})$/);
    if (yearData) {
      ctx.wizard.state.selectedYear = parseInt(yearData[1], 10);
      const title = ctx.t("calculate-bill.ask-month-year", { year: ctx.wizard.state.selectedYear });
      await ctx.callbackQuery?.message?.editText(title, {
        reply_markup: this.makeYearMonthKeyboard(ctx.wizard.state.selectedYear),
        parse_mode: "HTML"
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
      if (!account) return this.abort(ctx, ctx.t("error.account-not-found"));

      const result = await this.getBillForAccount(ctx, account, year, month);

      if (!result.success) {
        return this.abort(ctx, `❌ ${result.error}`, `account-${accountId}`);
      }

      const resultText = [
        ctx.t("calculate-bill.bill-header", { account: account.account_number, date: `${month.toString().padStart(2, "0")}.${year}` }),
        ...result.lines,
        "---",
        ctx.t("calculate-bill.total", { amount: result.totalCost.toFixed(2), currency: account.currency })
      ].join("\n");

      await ctx.wizard.state.message!.editText(resultText, {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text(ctx.t("button.back"), `account-${accountId}`),
      });

    } else if (addressId) {
      const accounts = await Account.find({ address_id: addressId });
      if (accounts.length === 0) {
        return this.abort(ctx, ctx.t("calculate-bill.error-no-accounts"), `address-${addressId}`);
      }

      // Группируем итоги по валютам
      let grandTotals: number = 0;
      const allResults: string[] = [ctx.t("calculate-bill.summary-header", { date: `${month.toString().padStart(2, "0")}.${year}` }) + "\n"];

      for (const account of accounts) {
        const result = await this.getBillForAccount(ctx, account, year, month);

        if (result.success) {
          grandTotals += result.totalCost;
          allResults.push(ctx.t("calculate-bill.account-header", { account: account.account_number, emoji: EResource[account.resource].emoji }));
          allResults.push(...result.lines);
          allResults.push(ctx.t("calculate-bill.account-total", { amount: result.totalCost.toFixed(2), currency: account.currency }));
          allResults.push("\n");
        } else {
          allResults.push(ctx.t("calculate-bill.account-header", { account: account.account_number, emoji: EResource[account.resource].emoji }));
          allResults.push(`  - ⚠️ ${result.error}`);
          allResults.push("\n");
        }
      }

      allResults.push(ctx.t("calculate-bill.grand-total", { amount: grandTotals.toFixed(2), currency: accounts[0].currency }));

      await ctx.wizard.state.message!.editText(allResults.join("\n"), {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text(ctx.t("button.back"), `address-${addressId}`),
      });
    } else {
      return this.abort(ctx, ctx.t("calculate-bill.error-no-id"));
    }

    return ctx.scene.leave();
  }

  private async getBillForAccount(ctx: CallbackContext, account: IAccount, year: number, month: number): Promise<{ success: true, lines: string[], totalCost: number } | { success: false, error: string }> {
    const { _id: accountId } = account;
    const readingDate = new Date(year, month - 1, 1);
    let totalCost = 0;
    const resultLines: string[] = [];

    // Расчет для "Квартплаты" (rent)
    if (account.resource === 'rent') {
      if (account.unit === 'unit.m2') {
        if (!account.area) return { success: false, error: ctx.t("calculate-bill.error-no-area") };

        const tariff = await Tariff.findOne({ account_id: accountId, startDate: { $lte: readingDate } }).sort({ startDate: -1 });
        if (!tariff) return { success: false, error: ctx.t("calculate-bill.error-tariff-not-found") };

        const tariffZone = tariff.zones.find(z => z.name === "standard") || tariff.zones[0];
        if (!tariffZone) return { success: false, error: ctx.t("calculate-bill.error-tariff-zone-not-found") };

        const cost = account.area * tariffZone.price;
        totalCost += cost;

        resultLines.push(ctx.t("calculate-bill.line-area", {
          area: account.area,
          unit: ctx.t(account.unit),
          price: `${tariffZone.price.toFixed(2)} ${account.currency}`,
          cost: `${cost.toFixed(2)} ${account.currency}`
        }));
      }
      // Для 'услуга' или других юнитов квартплаты - расчет только по абонплате, которая добавляется ниже.
      // Ничего не делаем здесь.
    } else if (account.resource === 'internet') {
      const tariff = await Tariff.findOne({ account_id: accountId, startDate: { $lte: readingDate } }).sort({ startDate: -1 });
      if (!tariff) return { success: false, error: ctx.t("calculate-bill.error-tariff-not-found") };

      const tariffZone = tariff.zones.find(z => z.name === "standard") || tariff.zones[0];
      if (!tariffZone) return { success: false, error: ctx.t("calculate-bill.error-tariff-zone-not-found") };

      const consumption = account.unit === 'unit.day' ? new Date(year, month, 0).getDate() : 1;
      const cost = tariffZone.price * consumption;
      totalCost += cost;

      resultLines.push(ctx.t("calculate-bill.line-internet", {
        consumption,
        unit: ctx.t(account.unit),
        price: `${tariffZone.price.toFixed(2)} ${account.currency}`,
        cost: `${cost.toFixed(2)} ${account.currency}`
      }));
    } else if (account.resource === 'garbage' || account.resource === 'other') {
      const tariff = await Tariff.findOne({ account_id: accountId, startDate: { $lte: readingDate } }).sort({ startDate: -1 });
      if (!tariff) return { success: false, error: ctx.t("calculate-bill.error-tariff-not-found") };

      const tariffZone = tariff.zones.find(z => z.name === "standard") || tariff.zones[0];
      if (!tariffZone) return { success: false, error: ctx.t("calculate-bill.error-tariff-zone-not-found") };

      let consumption = 1;
      let lineKey = "calculate-bill.line-unit-service";
      let lineKeyPayload: Record<string, unknown> = { quantity: 1 };

      if (account.unit === 'unit.m2') {
        if (!account.area || account.area <= 0) return { success: false, error: ctx.t("calculate-bill.error-no-area") };
        consumption = account.area;
        lineKey = "calculate-bill.line-area";
        lineKeyPayload = { area: consumption };
      } else if (account.unit === 'unit.person') {
        if (!account.area || account.area <= 0) return { success: false, error: ctx.t("calculate-bill.error-no-persons") };
        consumption = account.area;
        lineKey = "calculate-bill.line-persons";
        lineKeyPayload = { persons: consumption };
      }

      const cost = tariffZone.price * consumption;
      totalCost += cost;

      resultLines.push(ctx.t(lineKey, { ...lineKeyPayload, unit: ctx.t(account.unit), price: `${tariffZone.price.toFixed(2)} ${account.currency}`, cost: `${cost.toFixed(2)} ${account.currency}` }));
    } else {
      // Расчет для всех остальных ресурсов по показаниям
      const currentReading = await UtilitiesReading.findOne({ account_id: accountId, year, month });
      if (!currentReading) return { success: false, error: ctx.t("calculate-bill.error-readings-not-found") };

      const prevMonthDate = new Date(year, month - 1, 1);
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth() + 1;

      const previousReading = await UtilitiesReading.findOne({ account_id: accountId, year: prevYear, month: prevMonth });
      if (!previousReading) {
        return { success: false, error: ctx.t("calculate-bill.error-prev-readings-not-found", { date: `${prevMonth}.${prevYear}` }) };
      }

      const tariff = await Tariff.findOne({ account_id: accountId, startDate: { $lte: readingDate } }).sort({ startDate: -1 });
      if (!tariff) return { success: false, error: ctx.t("calculate-bill.error-tariff-not-found") };

      for (const currentZone of currentReading.zones) {
        const prevZone = previousReading.zones.find((z) => z.name === currentZone.name);
        const tariffZone = tariff.zones.find((z) => z.name === currentZone.name);

        if (!prevZone || !tariffZone) continue;

        const consumption = currentZone.value - prevZone.value;
        if (consumption < 0) return { success: false, error: ctx.t("calculate-bill.error-negative-consumption", { zone: currentZone.name }) };

        const cost = consumption * tariffZone.price;
        totalCost += cost;

        const unit = account.unit || EResource[account.resource].units[0];

        resultLines.push(ctx.t("calculate-bill.line-zone", {
          zone: currentZone.name,
          consumption,
          unit: ctx.t(unit),
          price: `${tariffZone.price.toFixed(2)} ${account.currency}`,
          cost: `${cost.toFixed(2)} ${account.currency}`
        }));
      }
    }

    // 5. Добавляем абонплату (FixedFee)
    const fixedFee = await FixedFee.findOne({ account_id: accountId, startDate: { $lte: readingDate } }).sort({ startDate: -1 });
    if (fixedFee) {
      totalCost += fixedFee.amount;
      resultLines.push(ctx.t("calculate-bill.line-fixed-fee", { amount: `${fixedFee.amount} ${account.currency}` }));
    }

    return { success: true, lines: resultLines, totalCost };
  }
};
