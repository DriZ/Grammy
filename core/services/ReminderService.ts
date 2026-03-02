import cron from "node-cron";
import { User, UserAddress, Account, UtilitiesReading, Reminder } from "@models/index.js";
import type BotClient from "@core/Client.js";
import { InlineKeyboard } from "grammy";

export class ReminderService {
  private client: BotClient;

  constructor(client: BotClient) {
    this.client = client;
  }

  public init() {
    // Запускаем проверку каждую минуту
    cron.schedule("* * * * *", async () => {
      await this.sendReminders();
    });
    console.log("✅ ReminderService initialized (Schedule: Every minute)");
  }

  private async sendReminders() {
    const now = new Date();

    try {
      // 1. Находим все активные напоминания
      const reminders = await Reminder.find({ isEnabled: true });
      if (reminders.length === 0) return;

      // Собираем уникальные ID пользователей для оптимизации запросов
      const userIds = new Set(reminders.map(r => r.telegram_id));
      const users = await User.find({ telegram_id: { $in: Array.from(userIds) } });
      const userMap = new Map(users.map(u => [u.telegram_id, u]));

      for (const reminder of reminders) {
        const user = userMap.get(reminder.telegram_id);
        if (!user) continue;

        // Определяем текущее время в часовом поясе пользователя
        const userTimezone = user.timezone || "Europe/Kyiv";
        const userTimeStr = now.toLocaleString("en-US", { timeZone: userTimezone });
        const userDate = new Date(userTimeStr);

        // Корректировка для месяцев, в которых меньше дней, чем указано в напоминании
        // Например, если напоминание на 31-е число, а сейчас апрель (30 дней), сработает 30-го.
        const daysInMonth = new Date(userDate.getFullYear(), userDate.getMonth() + 1, 0).getDate();
        const triggerDay = Math.min(reminder.dayOfMonth, daysInMonth);

        // Проверяем совпадение дня, часа и минуты
        if (userDate.getDate() !== triggerDay ||
          userDate.getHours() !== reminder.hour ||
          userDate.getMinutes() !== reminder.minute) {
          continue;
        }

        const userId = reminder.telegram_id;
        try {
          // 2. Находим все адреса пользователя
          const userAddresses = await UserAddress.find({ telegram_id: userId });
          if (userAddresses.length === 0) continue;

          const addressIds = userAddresses.map(ua => ua.address_id);

          // 3. Находим все счета по этим адресам
          const accounts = await Account.find({ address_id: { $in: addressIds } });
          if (accounts.length === 0) continue;

          // 4. Проверяем, есть ли счета БЕЗ показаний за текущий месяц
          let pendingAccountsCount = 0;

          // Используем месяц и год пользователя для проверки наличия показаний
          const checkYear = userDate.getFullYear();
          const checkMonth = userDate.getMonth() + 1;

          for (const account of accounts) {
            const hasReading = await UtilitiesReading.exists({
              account_id: account._id,
              year: checkYear,
              month: checkMonth
            });

            if (!hasReading) {
              pendingAccountsCount++;
            }
          }

          // 5. Если есть долги по показаниям, отправляем уведомление
          if (pendingAccountsCount > 0) {
            const lang = user.language || "ru";
            const message = this.client.i18n.t(lang, "reminder.message", {
              count: pendingAccountsCount
            });

            const keyboard = new InlineKeyboard()
              .text(this.client.i18n.t(lang, "utilities-menu.title"), "utilities-menu"); // Или ссылка на utilities-menu

            await this.client.api.sendMessage(userId, message, {
              parse_mode: "HTML",
              reply_markup: keyboard
            });

            // Небольшая задержка, чтобы не спамить API
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          console.error(`❌ Error sending reminder to user ${userId}:`, err);
        }
      }
    } catch (error) {
      console.error("❌ Critical error in ReminderService:", error);
    }
  }
}
