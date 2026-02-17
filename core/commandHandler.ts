/**
 * commandHandler.ts - Обработчик команд
 *
 * Ключевые TypeScript концепции:
 * 1. Map<K, V> - типизированная карта (ключ-значение)
 * 2. Record<K, V> - объект с типизированными ключами и значениями
 * 3. async/await с типизацией возвращаемого значения
 * 4. Обобщения (Generics) - типы-параметры
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.js";
import Command from "../structures/Command.js";
import BotClient from "./Client.js";
import { BaseContext, PermissionLevel } from "../types/index.js";

// Получаем __dirname в ES модулях (требуется в TypeScript)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Обработчик команд
 * Управляет загрузкой, регистрацией и выполнением команд
 */
export default class CommandHandler {
  // Типизированные свойства класса
  private client: BotClient;

  // Map<ключ: string, значение: Command>
  private commands: Map<string, Command>;

  // Карта алиасов для быстрого поиска
  private aliases: Map<string, string>;

  /**
   * Конструктор
   * @param client - экземпляр BotClient
   */
  constructor(client: BotClient) {
    this.client = client;
    this.commands = new Map();
    this.aliases = new Map();
  }

  /**
   * Проверить, существует ли путь
   * @param filePath - путь к файлу
   * @returns true если файл существует
   */
  private _ifPath(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Загрузить одну команду из файла
   * @param commandPath - путь к файлу команды
   * @throws Error если файл не найден
   */
  async loadCommand(commandPath: string): Promise<void> {
    // Проверяем, существует ли файл команды
    if (!this._ifPath(commandPath)) {
      throw new Error(`⚠️  └─ Файл команды не найден: ${commandPath}`);
    }

    // Динамический импорт с типизацией
    const module = await import(`file://${commandPath}`);
    const command = new module.default(this.client) as Command;

    // Устанавливаем имя команды, если оно не задано
    if (!command?.info?.name) {
      command.info.name = path.parse(commandPath).name.toLowerCase();
    }

    // Проверяем, включена ли команда
    if (!command.config.enabled) {
      console.log(
        `⚠️  └─ Команда ${command.info.name} отключена в конфигурации. Пропускаю...`,
      );
      return;
    }

    // Сохраняем путь к файлу команды
    command.config.location = commandPath;

    // Определяем категорию команды из папки
    const categoryPath = path.parse(commandPath).dir.split(path.sep);
    command.info.category = categoryPath[categoryPath.length - 1].toUpperCase();

    // Регистрируем команду в карте
    this.commands.set(command.info.name, command);

    // Создаём обработчик команды (стрелочная функция сохраняет контекст this)
    const handler = (ctx: BaseContext) => this.executeCommand(command, ctx);

    // Регистрируем в Telegraf
    this.client.command(command.info.name, handler);
    console.log(`✅  └─ Команда ${command.info.name}`);

    // Регистрируем алиасы, если они есть
    if (command.info.aliases && Array.isArray(command.info.aliases)) {
      command.info.aliases.forEach((alias: string) => {
        this.aliases.set(alias, command.info.name);
        this.client.command(alias, handler);
        console.log(`✅    └─ Алиас ${alias}`);
      });
    }
  }

  /**
   * Загрузить все команды из директории
   * @param commandsDir - директория с командами (по умолчанию ./commands)
   * @returns Map со всеми загруженными командами
   */
  async loadCommands(
    commandsDir: string = path.join(__dirname, "..", "commands"),
  ): Promise<Map<string, Command>> {
    // Читаем директории категорий
    const categories = fs.readdirSync(commandsDir);

    for (const category of categories) {
      console.log(`\n📂 Загрузка категории: ${category.toUpperCase()}`);
      const categoryPath = path.join(commandsDir, category);
      const stat = fs.statSync(categoryPath);

      // Пропускаем файлы (не директории)
      if (!stat.isDirectory()) continue;

      // Читаем файлы .js в категории (скомпилированные TypeScript)
      const files = fs
        .readdirSync(categoryPath)
        .filter((file) => file.endsWith(".js"));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        try {
          await this.loadCommand(filePath);
        } catch (error) {
          console.error(
            `❌ Ошибка при загрузке команды из ${filePath}:`,
            error,
          );
          continue;
        }
      }
    }

    console.log(`\n📦 Всего команд загружено: ${this.commands.size}`);
    return this.commands;
  }

  /**
   * Зарегистрировать команды в меню бота
   */
  async registerBotMenu(): Promise<void> {
    try {
      // Массив для меню команд с типизацией
      const menuCommands: Array<{ command: string; description: string }> = [];

      // Добавляем только основные команды (без алиасов)
      for (const [name, command] of this.commands) {
        menuCommands.push({
          command: name,
          description: command.info.description || "No description",
        });
      }

      // Регистрируем команды в меню бота
      console.log("📝 Регистрирую команды...");
      const result = await this.client.api.setMyCommands(menuCommands);

      console.log(
        `\n✅ Команды зарегистрированы в меню бота (${menuCommands.length} всего)`,
      );
      console.log("Результат API:", result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Ошибка при регистрации команд в меню:", errorMsg);
      console.error("Full error:", error);
    }
  }

  /**
   * Получить команду по имени или алиасу
   * @param name - имя команды или алиас
   * @returns Command или null если не найдена
   */
  getCommand(name: string): Command | null {
    // Проверяем прямое имя команды
    if (this.commands.has(name)) {
      return this.commands.get(name) || null;
    }

    // Проверяем алиасы
    if (this.aliases.has(name)) {
      const commandName = this.aliases.get(name);
      return this.commands.get(commandName || "") || null;
    }

    return null;
  }

  /**
   * Получить все команды
   * @returns Map со всеми командами
   */
  getAllCommands(): Map<string, Command> {
    return this.commands;
  }

  /**
   * Отключить команду
   * @param name - имя команды
   * @returns true если команда отключена
   */
  unloadCommand(name: string): boolean {
    const command = this.getCommand(name);
    if (command) {
      this.commands.delete(command.info.name);
      // Удаляем алиасы
      if (command.info.aliases && Array.isArray(command.info.aliases)) {
        command.info.aliases.forEach((alias: string) =>
          this.aliases.delete(alias),
        );
      }
      console.log(`🛑 Команда отключена: ${command.info.name}`);
      return true;
    }
    return false;
  }

  /**
   * Получить команды по категории
   * @param category - название категории
   * @returns Массив команд или пустой массив
   */
  getCommandsByCategory(category: string): Command[] {
    return Array.from(this.commands.values()).filter(
      (cmd) => cmd.info.category === category,
    );
  }

  /**
   * Выполнить команду с проверкой прав доступа
   * @param command - команда для выполнения
   * @param ctx - контекст Telegraf
   */
  async executeCommand(command: Command, ctx: BaseContext): Promise<void> {
    const userId = this.getUserId(ctx);
    const isOwner = config.owner && userId === config.owner;
    const isAdmin = config.admins.includes(userId || 0);

    // Проверяем права доступа
    if (command.config.permission && command.config.permission > PermissionLevel.User) {
      if (command.config.permission === PermissionLevel.Owner && !isOwner) {
        // Команда только для владельца
        return void (await ctx.reply(
          `❌ Эта команда доступна только владельцу бота.`,
        ));
      } else if (command.config.permission === PermissionLevel.Admin && !isOwner && !isAdmin) {
        // Команда для администраторов и владельца
        return void (await ctx.reply(
          `❌ Эта команда доступна только администраторам.`,
        ));
      }
    }

    try {
      await command.execute(ctx);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Ошибка при выполнении команды ${command.info.name}:`,
        errorMsg,
      );
      await ctx.reply(`❌ Произошла ошибка при выполнении команды`);
    }
  }

  /**
   * Получить ID пользователя из контекста
   * @param ctx - контекст Telegraf
   * @returns ID пользователя или undefined
   */
  private getUserId(ctx: BaseContext): number | undefined {
    return ctx.from?.id;
  }
}
