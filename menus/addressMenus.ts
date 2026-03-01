import { Address, type IAccount } from "../models/index.js";
import { type CallbackContext, EResource, type IMenuButton } from "../types/index.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";

export class AddressMenu extends BaseMenu {
  private readonly PAGE_SIZE = 5;

  // Принимаем список аккаунтов в конструкторе, чтобы сформировать кнопки синхронно
  constructor(client: BotClient, private addressId: string, private accounts: IAccount[], private page: number = 0) {
    super(client, `address-${addressId}-${page}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const address = await Address.findById(this.addressId);
      return `${ctx.t("address-menu.title")} ${address?.name || "???"}:`;
    };
  }

  get buttons(): IMenuButton[] {
    const btns: IMenuButton[] = [];

    const start = this.page * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const pageAccounts = this.accounts.slice(start, end);

    pageAccounts.forEach((acc) => {
      const emoji = EResource[acc.resource]?.emoji || "❓";
      btns.push({
        text: (ctx) => `${emoji} ${ctx.t("button.account")}${acc.account_number}`,
        nextMenu: `account-${acc._id}`,
        callback: `account-${acc._id}`,
        row: true,
      });
    });

    // Пагинация
    const totalPages = Math.ceil(this.accounts.length / this.PAGE_SIZE);
    if (totalPages > 1) {
      if (this.page > 0) {
        btns.push({ text: "⬅️", nextMenu: `address-${this.addressId}-${this.page - 1}`, callback: `address-${this.addressId}-${this.page - 1}`, skipHistory: true });
      }

      btns.push({ text: `${this.page + 1}/${totalPages}`, callback: "noop" });

      if (this.page < totalPages - 1) {
        btns.push({ text: "➡️", nextMenu: `address-${this.addressId}-${this.page + 1}`, callback: `address-${this.addressId}-${this.page + 1}`, row: true, skipHistory: true });
      } else {
        btns[btns.length - 1].row = true;
      }
    }

    // Кнопка для расчета по всем счетам адреса
    if (this.accounts.length > 0) {
      btns.push({
        text: () => "🧾 Рассчитать все счета",
        callback: `calculate-bill-by-address-${this.addressId}`,
        row: true,
      });
    }

    btns.push({
      text: (ctx) => ctx.t("button.create-account"),
      callback: `create-account-${this.addressId}`,
      style: "success",
      row: true
    });

    if (this.accounts.length === 0) {
      btns.push({ text: (ctx) => ctx.t("button.delete-address"), callback: `delete-address-${this.addressId}`, row: true, style: "danger" });
    }

    return btns;
  }
}
