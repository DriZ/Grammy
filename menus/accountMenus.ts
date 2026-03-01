import { Account, type IAccount } from "../models/index.js";
import { type CallbackContext, EResource, type IMenuButton } from "../types/index.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";

export class AccountMenu extends BaseMenu {
  constructor(client: BotClient, private accountId: string, private account: IAccount) {
    super(client, `account-${accountId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const account = await Account.findById(this.accountId);
      if (!account) return ctx.t("account-menu.title");
      return `${EResource[account.resource].emoji ?? "📋"} ${ctx.t("account-menu.title")}${account.account_number}`;
    };
  }

  get buttons(): IMenuButton[] {
    const btns: IMenuButton[] = [
      { text: (ctx) => ctx.t("button.tariffs"), nextMenu: `tariffs-${this.accountId}`, callback: `tariffs-${this.accountId}`, row: true },
      { text: (ctx) => "💰 Абонплата", nextMenu: `fixed-fees-${this.accountId}`, callback: `fixed-fees-${this.accountId}`, row: true },
      { text: (ctx) => ctx.t("button.calculate-bill"), callback: `calculate-bill-${this.accountId}`, row: true },
      { text: (ctx) => ctx.t("button.readings"), nextMenu: `readings-${this.accountId}`, callback: `readings-${this.accountId}`, row: true },
      { text: (ctx) => "💱 Валюта", callback: `change-currency-${this.accountId}`, row: true },
    ];

    // Показываем кнопку смены единицы измерения только если для ресурса доступно более одной единицы
    if (EResource[this.account.resource].units.length > 1) {
      btns.push({ text: (ctx) => "📏 Единица изм.", callback: `change-unit-${this.accountId}`, row: true });
    }

    btns.push({ text: (ctx) => ctx.t("button.delete-account"), callback: `delete-account-${this.accountId}`, row: true, style: "danger" });
    return btns;
  }
}
