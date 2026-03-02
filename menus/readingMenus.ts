import { Account, UtilitiesReading } from "@models/index.js";
import { type CallbackContext, EResource, type MenuButton, type ZoneReading } from "@app-types/index.js";
import { BaseMenu } from "@structures/index.js";
import type BotClient from "@core/Client.js";

export class ReadingsMenu extends BaseMenu {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: BotClient, private accountId: string, private year: number, private readings: any[]) {
    super(client, `readings-${accountId}-${year}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const account = await Account.findById(this.accountId);
      if (!account) return ctx.t("error.account-not-found");

      // Расчет годового потребления
      let consumptionText = "";
      const prevYearDecReading = await UtilitiesReading.findOne({
        account_id: this.accountId,
        year: this.year - 1,
        month: 12,
      });

      // Берем последнее показание из текущего списка (так как он отсортирован по убыванию месяца)
      const latestReadingInSelectedYear = this.readings[0];

      if (prevYearDecReading && latestReadingInSelectedYear) {
        let totalConsumption = 0;
        for (const currentZone of latestReadingInSelectedYear.zones) {
          const prevZone = prevYearDecReading.zones.find((z: ZoneReading) => z.name === currentZone.name);
          if (prevZone) {
            const consumption = currentZone.value - prevZone.value;
            if (consumption >= 0) {
              totalConsumption += consumption;
            }
          }
        }

        if (totalConsumption > 0) {
          const unit = account.unit || EResource[account.resource].units[0];

          consumptionText = ` | ${ctx.t("readings-menu.consumption")}: ${totalConsumption.toFixed(0)} ${unit}`;
        }
      }

      return `${ctx.t("readings-menu.title", { year: this.year })} (${EResource[account.resource].emoji ?? ""} №${ctx.escapeHTML(account.account_number)})${consumptionText}`;
    };
  }

  get buttons(): MenuButton[] {
    const btns: MenuButton[] = [];

    this.readings.forEach((r) => {
      const zonesStr = r.zones.map((z: ZoneReading) => `${z.name}: ${z.value}`).join(", ");
      btns.push({
        text: `${r.month.toString().padStart(2, "0")}.${r.year} → ${zonesStr}`,
        nextMenu: `reading-${r._id}`,
        callback: `reading-${r._id}`,
        row: true,
      });
    });

    // Пагинация по годам
    btns.push({ text: `⬅️ ${this.year - 1}`, nextMenu: `readings-${this.accountId}-${this.year - 1}`, callback: `readings-${this.accountId}-${this.year - 1}`, skipHistory: true });
    btns.push({ text: `📅 ${this.year}`, callback: "noop" });
    btns.push({ text: `${this.year + 1} ➡️`, nextMenu: `readings-${this.accountId}-${this.year + 1}`, callback: `readings-${this.accountId}-${this.year + 1}`, row: true, skipHistory: true });
    btns.push({ text: (ctx) => ctx.t("button.create-reading"), callback: `create-reading-${this.accountId}`, row: true, style: "success" });

    return btns;
  }
}

export class ReadingMenu extends BaseMenu {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: BotClient, private readingId: string, private reading: any) {
    super(client, `reading-${readingId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const zonesStr = this.reading.zones.map((z: ZoneReading) => `${z.name}: ${z.value}`).join("\n");
      return `${ctx.t("reading-menu.reading-for")} ${this.reading.month}.${this.reading.year}:\n${zonesStr}`;
    };
  }

  get buttons(): MenuButton[] {
    return [
      { text: (ctx) => ctx.t("button.delete-reading"), callback: `delete-reading-${this.readingId}`, style: "danger", row: true }
    ];
  }
}
