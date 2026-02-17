/**
 * ping.ts - Команда для проверки пинга бота
 *
 * Пример простой команды на TypeScript:
 * 1. Расширяем базовый класс Command
 * 2. Типизируем методы
 * 3. Используем интерфейсы из Telegraf
 */

import Command from "../../structures/Command.js";
import type BotClient from "../../core/Client.js";
import { BaseContext } from "../../types/index.js";

/**
 * Класс команды ping
 * extends Command - наследуем от базового класса
 */
export default class PingCommand extends Command {
  /**
   * Конструктор команды
   */
  constructor(client: BotClient) {
    super(client, {
      description: "Проверить скорость отклика бота",
      aliases: ["p", "pong"],
    });
  }

  async execute(ctx: BaseContext): Promise<void> {
    const sent = await ctx.reply("Pong! 🏓");
    const latency = (sent.message_id || 0) - (ctx.message?.message_id || 0);

    await ctx.reply(`Latency: ${latency}ms`);
  }
}
