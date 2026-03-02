import { Address, type IAccount, UserAddress, type IUser } from "../models/index.js";
import { type CallbackContext, EResource, type MenuButton } from "../types/index.js";
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
      if (!address) return ctx.t("error.address-not-found", { id: this.addressId });

      const isOwner = address.ownerId === ctx.from?.id;
      const baseTitle = ctx.t("address-menu.title", { address: ctx.escapeHTML(address.name) });

      if (isOwner) {
        const inviteLink = `https://t.me/${ctx.me.username}?start=invite_${address._id}`;
        const ownerDetails = ctx.t("address-menu.owner-details", { id: address._id.toString(), link: inviteLink });
        return `${baseTitle}\n\n${ownerDetails}`;
      }

      return baseTitle;
    };
  }

  get buttons() {
    return async (ctx: CallbackContext): Promise<MenuButton[]> => {
      const btns: MenuButton[] = [];

      const start = this.page * this.PAGE_SIZE;
      const end = start + this.PAGE_SIZE;
      const pageAccounts = this.accounts.slice(start, end);

      pageAccounts.forEach((acc) => {
        const emoji = EResource[acc.resource].emoji;
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
          text: (ctx) => ctx.t("button.calculate-all-bills"),
          callback: `calculate-bill-by-address-${this.addressId}`,
          row: true,
        });
      }

      btns.push({
        text: (ctx) => ctx.t("button.create-account"),
        callback: `create-account-${this.addressId}`,
        style: "success",
        row: true,
      });

      const address = await Address.findById(this.addressId);
      const isOwner = address?.ownerId === ctx.from?.id;

      // Если есть владелец и это не текущий пользователь — показываем кнопку "Отвязать"
      if (address?.ownerId && !isOwner) {
        btns.push({ text: (ctx) => ctx.t("button.unlink-address"), callback: `delete-address-${this.addressId}`, row: true, style: "danger" });
      } else {
        if (isOwner) {
          const otherUsersCount = await UserAddress.countDocuments({ address_id: this.addressId, telegram_id: { $ne: ctx.from?.id } });
          if (otherUsersCount > 0) {
            btns.push({ text: (ctx) => ctx.t("button.address-users"), nextMenu: `address-users-${this.addressId}`, callback: `address-users-${this.addressId}`, row: true });
          }
        }
        if (this.accounts.length === 0) {
          btns.push({ text: (ctx) => ctx.t("button.delete-address"), callback: `delete-address-${this.addressId}`, row: true, style: "danger" });
        }
      }
      return btns;
    };
  }
}

export class AddressUsersMenu extends BaseMenu {
  constructor(client: BotClient, private addressId: string, private users: IUser[], private addressName: string) {
    super(client, `address-users-${addressId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => ctx.t("address-users-menu.title", { address: ctx.escapeHTML(this.addressName) });
  }

  get buttons() {
    return async (ctx: CallbackContext): Promise<MenuButton[]> => {
      const btns: MenuButton[] = [];

      for (const user of this.users) {
        let displayName = `ID: ${user.telegram_id}`;
        try {
          const chat = await ctx.api.getChat(user.telegram_id);
          if (chat.type === "private") {
            displayName = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
            if (chat.username) displayName += ` (@${chat.username})`;
          }
        } catch (e) {
          // Если не удалось получить данные (например, юзер заблокировал бота), оставляем ID
        }

        btns.push({
          text: displayName,
          nextMenu: `address-user-${this.addressId}-${user.telegram_id}`,
          callback: `address-user-${this.addressId}-${user.telegram_id}`,
          row: true
        });
      }
      return btns;
    };
  }
}

export class AddressUserMenu extends BaseMenu {
  constructor(client: BotClient, private addressId: string, private targetUser: IUser) {
    super(client, `address-user-${addressId}-${targetUser.telegram_id}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      let displayName = `ID: ${this.targetUser.telegram_id}`;
      try {
        const chat = await ctx.api.getChat(this.targetUser.telegram_id);
        if (chat.type === "private") {
          displayName = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
          if (chat.username) displayName += ` (@${chat.username})`;
        }
      } catch (e) {
        // Игнорируем ошибку
      }

      return ctx.t("address-user-menu.title", { user: ctx.escapeHTML(displayName) });
    };
  }

  get buttons(): MenuButton[] {
    return [
      {
        text: (ctx) => ctx.t("button.transfer-address"),
        callback: `transfer-address-${this.addressId}-${this.targetUser.telegram_id}`,
        row: true,
        skipHistory: true
      },
      {
        text: (ctx) => ctx.t("button.kick-user"),
        callback: `kick-user-${this.addressId}-${this.targetUser.telegram_id}`,
        style: "danger",
        row: true,
        skipHistory: true
      }
    ];
  }
}
