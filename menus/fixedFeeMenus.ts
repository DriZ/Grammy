import type { CallbackContext, MenuButton } from "../types/index.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";
import type { IFixedFee } from "@models/index.js";


export class FixedFeesMenu extends BaseMenu {
  constructor(client: BotClient, private accountId: string, private fees: IFixedFee[], private currency: string) {
    super(client, `fixed-fees-${accountId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => ctx.t("button.fixed-fees");
  }

  get buttons(): MenuButton[] {
    const btns: MenuButton[] = [];

    if (this.fees.length > 0) {
      this.fees.forEach((f) => {
        const month = f.startDate.getMonth() + 1;
        const year = f.startDate.getFullYear();
        const priceStr = f.amount.toLocaleString('ru-RU', { style: 'currency', currency: this.currency, currencyDisplay: 'symbol' });

        btns.push({
          text: `${month.toString().padStart(2, "0")}.${year}: ${priceStr}`,
          nextMenu: `fixed-fee-${f._id}`,
          callback: `fixed-fee-${f._id}`,
          row: true
        });
      });
    }

    btns.push({
      text: (ctx) => ctx.t("button.create-fixed-fee"),
      callback: `create-fixedfee-${this.accountId}`,
      style: "success",
      row: true
    });

    return btns;
  }
}

export class FixedFeeMenu extends BaseMenu {
  constructor(client: BotClient, private feeId: string, private fee: IFixedFee, private currency: string) {
    super(client, `fixed-fee-${feeId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const locale = await ctx.i18n.getLocale() === "ua" ? "uk" : await ctx.i18n.getLocale();
      const priceStr = this.fee.amount.toLocaleString(locale, { style: 'currency', currency: this.currency, currencyDisplay: 'symbol' });
      return ctx.t("fixed-fee-menu.title", { amount: priceStr, startDate: this.fee.startDate.toLocaleDateString(locale) });
    };
  }

  get buttons(): MenuButton[] {
    return [
      {
        text: (ctx) => ctx.t("button.delete"),
        callback: `delete-fixedfee-${this.feeId}`,
        style: "danger",
        row: true
      }
    ];
  }
}
