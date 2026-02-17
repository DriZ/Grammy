/**
 * Command.ts - Базовый класс для команд
 *
 * TypeScript концепции:
 * 1. Abstract класс - базовый класс, который нельзя инстанцировать напрямую
 * 2. Abstract методы - методы, которые должны быть реализованы в наследующих классах
 * 3. Interface для параметров конструктора
 * 4. Типизированные свойства
 */

import { PermissionLevel } from "../types/index.js";
import type {
  CommandInfo,
  CommandConfig,
  CommandOptions,
  BaseContext,
} from "../types/index.js";
import BotClient from "../core/Client.js";

/**
 * Абстрактный (abstract) базовый класс для всех команд
 *
 * abstract = класс, который служит шаблоном для других классов
 * Нельзя создать: new Command() ❌
 * Можно расширить: class MyCommand extends Command ✅
 */
export default abstract class Command {
  // Типизированные свойства
  protected client: BotClient;
  public info: CommandInfo;
  public config: CommandConfig;

  /**
   * Конструктор команды
   * @param client - экземпляр BotClient
   * @param options - опции конфигурации команды
   */
  constructor(client: BotClient, options: CommandOptions) {
    this.client = client;

    // Деструктуризация с значениями по умолчанию
    const {
      name = null,
      description = "No description provided",
      aliases = [],
      category = "General",
      usage = `/${name || "command"}`,
      permission = PermissionLevel.User,
      location = null,
      enabled = true,
    } = options;

    // Инициализируем объекты с правильными типами
    this.config = { permission, location, enabled };
    this.info = {
      name: name || "",
      description,
      aliases,
      category,
      usage,
    };
  }

  /**
   * Абстрактный метод execute
   * Каждая команда ДОЛЖНА реализовать этот метод
   *
   * @param ctx - контекст Telegraf с информацией о сообщении
   */
  abstract execute(ctx: BaseContext): Promise<void> | void;

  /**
   * Перезагрузить команду
   * Выгружает и загружает команду заново
   *
   * @param ctx - опциональный контекст для отправки сообщений
   */
  async reload(ctx?: BaseContext): Promise<void> {
    // Отправляем сообщение о начале перезагрузки
    let msg = ctx ? await ctx.reply("♻️ Перезагрузка команды...") : null;

    // Задержка для визуального эффекта
    await this.client.utils.sleep(500);

    const commandPath = this.config.location;
    if (!commandPath) {
      if (msg && ctx) {
        await ctx.editMessageText("❌ Не удалось перезагрузить команду: путь к файлу не найден.");
      }
      throw new Error(
        `Cannot reload command ${this.info.name}: file path not found.`,
      );
    }

    // Выгружаем команду
    await this.client.utils.sleep(500);
    if (msg && ctx) {
      await ctx.editMessageText("♻️ Выгружаю команду...");
    }
    this.client.commandHandler.unloadCommand(this.info.name);

    // Загружаем команду заново
    await this.client.utils.sleep(500);
    if (msg && ctx) {
      await ctx.editMessageText("♻️ Выгружено. Загружаю команду...");
    }
    await this.client.commandHandler.loadCommand(commandPath);

    console.log(`✅ Command reloaded: ${this.info.name}`);
  }
}
