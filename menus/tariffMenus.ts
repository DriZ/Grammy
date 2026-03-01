import type { CallbackContext, IMenuButton } from "../types/index.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";
import type { ITariff, ZoneParams } from "@models/tariff.js";

export class TariffsMenu extends BaseMenu {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: BotClient, private accountId: string, private tariffs: ITariff[], private currency: string) {
    super(client, `tariffs-${accountId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => ctx.t("button.tariffs");
  }

  get buttons(): IMenuButton[] {
    const btns: IMenuButton[] = [];

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

  get buttons(): IMenuButton[] {
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
