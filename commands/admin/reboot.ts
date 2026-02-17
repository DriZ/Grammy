/**
 * reboot.ts - Команда для перезагрузки бота
 *
 * Требует прав администратора (permission: 1)
 */

import Command from "../../structures/Command.js";
import type BotClient from "../../core/Client.js";
import { BaseContext } from "../../types/index.js";

/**
 * Команда reboot - перезагружает бот процесс
 */
export default class RebootCommand extends Command {
  constructor(client: BotClient) {
    super(client, {
      description: "Перезагрузить бота",
      permission: 1, // Только админы
      aliases: ["r", "restart"],
    });
  }

  /**
   * Выполнить команду
   */
  async execute(ctx: BaseContext): Promise<void> {
    // Отправляем уведомление
    await ctx.reply("🔄 Перезагружаюсь...");

    // Даём время на отправку сообщения, потом выходим из процесса
    // process.exit(0) - выход с кодом 0 (успешно)
    // PM2 или другой процесс-менеджер перезапустит бота
    setTimeout(() => {
      process.exit(0);
    }, 500);
  }
}
