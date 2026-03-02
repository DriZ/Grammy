import { EResource, type CallbackContext, type MenuButton } from "../types/index.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";
import type { ITariff, ZoneParams } from "@models/tariff.js";
import { Account } from "@models/account.js";

export class TariffsMenu extends BaseMenu {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: BotClient, private accountId: string, private tariffs: ITariff[], private currency: string) {
    super(client, `tariffs-${accountId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const account = await Account.findOne({ _id: this.accountId });
      if (!account) return ctx.t("error.account-not-found");
      return `${ctx.t("button.tariffs")}\n${EResource[account.resource].emoji ?? "📋"} ${ctx.t("account-menu.title")}${ctx.escapeHTML(account.account_number)}`;
    }
  }

  get buttons(): MenuButton[] {
    const btns: MenuButton[] = [];

    if (this.tariffs.length > 0) {
      this.tariffs.forEach((t) => {
        const month = t.startDate.getMonth() + 1;
        const year = t.startDate.getFullYear();
        const zonesStr = t.zones.map((z: ZoneParams) => `${z.name}: ${z.price.toLocaleString('ru-RU', { style: 'currency', currency: this.currency })}`).join(", ");

        btns.push({
          text: `${month.toString().padStart(2, "0")}.${year}: ${zonesStr}`,
          nextMenu: `tariff-${t._id}`,
          callback: `tariff-${t._id}`,
          row: true
        });
      });
    }

    btns.push({
      text: (ctx) => ctx.t("button.create-tariff"),
      callback: `create-tariff-${this.accountId}`,
      style: "success",
      row: true
    });

    return btns;
  }
}

export class TariffMenu extends BaseMenu {
  constructor(client: BotClient, private tariffId: string, private tariff: ITariff, private currency: string) {
    super(client, `tariff-${tariffId}`);
  }

  get title() {
    return async (_ctx: CallbackContext) => {
      const zonesStr = this.tariff.zones.map((z: ZoneParams) => `${z.name}: ${z.price.toLocaleString('ru-RU', { style: 'currency', currency: this.currency, currencyDisplay: 'symbol' })}`).join("\n");
      return `💰 Тариф (${this.tariff.type})\n${zonesStr}\nНачало действия: ${this.tariff.startDate.toLocaleDateString('ru-RU')}`;
    };
  }

  get buttons(): MenuButton[] {
    return [
      {
        text: "🗑️ Удалить тариф",
        callback: `delete-tariff-${this.tariffId}`,
        style: "danger",
        row: true
      }
    ];
  }
}
