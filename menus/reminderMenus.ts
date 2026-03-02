import { Reminder, type IReminder, User } from "@models/index.js";
import { type CallbackContext, type MenuButton } from "@app-types/index.js";
import { BaseMenu } from "@structures/index.js";
import type BotClient from "@core/Client.js";

export class RemindersMenu extends BaseMenu {
  constructor(client: BotClient, private telegramId: number) {
    super(client, "reminders-menu");
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const user = await User.findOne({ telegram_id: this.telegramId });
      const tz = user?.timezone || "Europe/Kyiv";
      return ctx.t("reminders-menu.title", { timezone: tz });
    }
  }

  get buttons() {
    return async (ctx: CallbackContext): Promise<MenuButton[]> => {
      const reminders = await Reminder.find({ telegram_id: this.telegramId });
      const btns: MenuButton[] = [];

      reminders.forEach((r) => {
        const status = r.isEnabled ? "✅" : "🔕";
        const timeStr = `${r.hour.toString().padStart(2, '0')}:${r.minute.toString().padStart(2, '0')}`;
        btns.push({
          text: `${status} ${r.dayOfMonth} (${timeStr}) - ${r.title}`,
          nextMenu: `reminder-${r._id}`,
          callback: `reminder-${r._id}`,
          row: true,
        });
      });

      btns.push({
        text: ctx.t("button.create-reminder"),
        callback: "create-reminder",
        row: true,
        style: "success",
      });

      btns.push({
        text: ctx.t("button.set-timezone"),
        callback: "set-timezone",
        row: true,
      });

      return btns;
    };
  }
}

export class ReminderMenu extends BaseMenu {
  constructor(client: BotClient, private reminderId: string, private reminder: IReminder) {
    super(client, `reminder-${reminderId}`);
  }

  get title() {
    return async (ctx: CallbackContext) => {
      const status = this.reminder.isEnabled ? ctx.t("reminder.enabled") : ctx.t("reminder.disabled");
      const timeStr = `${this.reminder.hour.toString().padStart(2, '0')}:${this.reminder.minute.toString().padStart(2, '0')}`;
      return ctx.t("reminder-menu.title", {
        day: `${this.reminder.dayOfMonth} (${timeStr})`,
        title: ctx.escapeHTML(this.reminder.title),
        status: status
      });
    };
  }

  get buttons(): MenuButton[] {
    return [
      {
        text: (ctx) => this.reminder.isEnabled ? ctx.t("button.disable") : ctx.t("button.enable"),
        callback: `toggle-reminder-${this.reminderId}`,
        action: async (ctx) => {
          this.reminder.isEnabled = !this.reminder.isEnabled;
          await this.reminder.save();
          await ctx.services.menuManager.showMenu(ctx, this.id);
        },
        row: true
      },
      {
        text: (ctx) => ctx.t("button.delete"),
        callback: `delete-reminder-${this.reminderId}`,
        style: "danger",
        row: true
      }
    ];
  }
}
