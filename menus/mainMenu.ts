import { UserAddress } from "../models/index.js";
import type { CallbackContext, MenuButton } from "../types/index.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";
import config from "@root/config.js";

export default class UtilitiesMenu extends BaseMenu {
  constructor(client: BotClient) {
    super(client, "main-menu");
  }

  get title() {
    return async (ctx: CallbackContext) => ctx.t("main-menu.title");
  }

  get buttons() {
    return async (ctx: CallbackContext): Promise<MenuButton[]> => {
      const telegramId = ctx.from?.id;
      const btns: MenuButton[] = [];

      if (telegramId) {
        const userAddresses = await UserAddress.find({ telegram_id: telegramId }).populate("address_id");
        userAddresses.forEach((ua) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const addr = (ua as any).address_id;
          if (addr) {
            btns.push({
              text: `🏠 ${addr.name}`,
              nextMenu: `address-${addr._id}`,
              callback: `address-${addr._id}`,
              row: true,
            });
          }
        });
      }

      btns.push({
        text: (ctx) => ctx.t("button.change-language"),
        nextMenu: "language-menu",
        callback: "language-menu",
        row: true,
      });

      btns.push({
        text: (ctx) => ctx.t("button.reminders"),
        nextMenu: "reminders-menu",
        callback: "reminders-menu",
        row: true,
      });

      btns.push({
        text: (ctx) => ctx.t("button.create-address"),
        callback: "create-address",
        row: true,
        style: "success",
      });

      if (ctx.from && ctx.from.id === config.owner) {
        btns.push({
          text: (ctx) => ctx.t("main-menu.button-ping"),
          callback: "cmd:ping",
          row: true,
          style: "primary",
        }, {
          text: (ctx) => ctx.t("main-menu.button-whoami"),
          callback: "cmd:whoami",
          row: true,
          style: "primary",
        }, {
          text: (ctx) => ctx.t("main-menu.button-stats"),
          callback: "cmd:stats",
          row: true,
          style: "primary",
        }, {
          text: (ctx) => ctx.t("main-menu.button-version"),
          callback: "cmd:version",
          row: true,
          style: "primary",
        })
      }

      return btns;
    };
  }
}
