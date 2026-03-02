import { BaseCommand } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { type BaseContext, EPermissionLevel } from "@app-types/index.js";
import { UserAddress } from "@models/index.js";

/**
 * Форматирует миллисекунды в читаемую строку (дни, часы, минуты, секунды).
 * @param ms - Количество миллисекунд.
 */
function formatDuration(ms: number): string {
  if (ms < 0) ms = -ms;
  const time = {
    д: Math.floor(ms / 86400000),
    ч: Math.floor(ms / 3600000) % 24,
    м: Math.floor(ms / 60000) % 60,
    с: Math.floor(ms / 1000) % 60,
  };
  return (
    Object.entries(time)
      .filter(([, val]) => val !== 0)
      .map(([key, val]) => `${val}${key}`)
      .join(" ") || "0с"
  );
}

export default class StatsCommand extends BaseCommand {
  constructor(client: BotClient) {
    super(client, {
      name: "stats",
      description: "Показать статистику бота.",
      category: "Owner",
      permission: EPermissionLevel.Owner,
    });
  }

  async execute(ctx: BaseContext): Promise<void> {
    // 1. Время работы (Uptime)
    const uptimeDiff = Date.now() - this.client.startTime.getTime();
    const uptimeString = formatDuration(uptimeDiff);

    // 2. Использование памяти
    const memoryUsage = process.memoryUsage().rss;
    const memoryString = `${(memoryUsage / 1024 / 1024).toFixed(2)} MB`;

    // 3. Количество пользователей (считаем уникальных пользователей, у которых есть адреса)
    let userCount: number | string = 0;
    try {
      // Считаем уникальные telegram_id в коллекции UserAddress
      const uniqueUsers = await UserAddress.distinct("telegram_id");
      userCount = uniqueUsers.length;
    } catch (error) {
      console.error("[StatsCommand] Не удалось получить количество пользователей:", error);
      userCount = "Не удалось посчитать";
    }

    const statsMessage = `📊 <b>Статистика Бота</b>

⏱️ <b>Время работы:</b> ${ctx.escapeHTML(uptimeString)}
💾 <b>Память (RAM):</b> ${ctx.escapeHTML(memoryString)}
👥 <b>Пользователей (с адресами):</b> ${ctx.escapeHTML(userCount.toString())}`;

    await ctx.reply(statsMessage, { parse_mode: "HTML" });
  }
}
