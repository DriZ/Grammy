import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.js";
import Command from "./Command.mjs";
import { Context } from "telegraf";
import BotClient from "./Client.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class CommandHandler {
  /**
   *
   * @param {BotClient} client
   */
  constructor(client) {
    this.client = client;
    this.commands = new Map();
    this.aliases = new Map();
  }

  /**
   *
   * @param {String} path
   * @returns {Boolean}
   */
  _ifPath(path) {
    return fs.existsSync(path);
  }

  /**
   *
   * @param {String} commandPath
   */
  async loadCommand(commandPath) {
	// Проверяем, существует ли файл команды
    if (!this._ifPath(commandPath)) {
      throw new Error(`⚠️  └─ Файл команды не найден: ${commandPath}`);
    }
    const module = await import(`file://${commandPath}`);
    const command = new module.default(this.client);

	// Устанавливаем имя команды, если оно не задано в конструкторе
    if (!command?.info?.name) command.info.name = path.parse(commandPath).name.toLowerCase();

	// Проверяем, включена ли команда
    if (!command.config.enabled) {
      console.log(
        `⚠️  └─ Команда ${command.info.name} отключена в конфигурации. Пропускаю...`,
      );
      return;
    }

	// Сохраняем путь к файлу команды
    command.config.location = commandPath;

    const category = path.parse(commandPath).dir.split(path.sep);
    command.info.category = category[category.length - 1].toUpperCase();

    // Регистрируем команду
    this.commands.set(command.info.name, command);

    // Обработчик для основной команды с проверкой прав
    const handler = (ctx) => this.executeCommand(command, ctx);

    // Регистрируем команду в Telegraf
    this.client.command(command.info.name, handler);
    console.log(`✅  └─ Команда ${command.info.name}`);

    // Регистрируем алиасы, если они есть
    if (command.info.aliases && Array.isArray(command.info.aliases)) {
      command.info.aliases.forEach((alias) => {
        this.aliases.set(alias, command.info.name);
        // Регистрируем алиас как отдельную команду в Telegraf
        this.client.command(alias, handler);
        console.log(`✅    └─ Алиас ${alias} `);
      });
    } else {
      console.log(`⚠️    Алиасы не найдены или не массив`);
    }
  }

  /**
   *
   * @param {String|null} commandsDir
   */
  async loadCommands(commandsDir = null) {
    if (!commandsDir) commandsDir = path.join(__dirname, "..", "commands");

    const categories = fs.readdirSync(commandsDir);

    for (const category of categories) {
      console.log(`\n📂 Загрузка категории: ${category.toUpperCase()}`);
      const categoryPath = path.join(commandsDir, category);
      const stat = fs.statSync(categoryPath);

      if (!stat.isDirectory()) continue;

      const files = fs
        .readdirSync(categoryPath)
        .filter((file) => file.endsWith(".mjs"));
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        try {
          await this.loadCommand(filePath);
        } catch (error) {
          console.error(
            `❌ Ошибка при загрузке команды из ${commandPath}:`,
            error,
          );
          continue;
        }
      }
    }

    console.log(`\n📦 Всего команд загружено: ${this.commands.size}`);
    return this.commands;
  }

  async registerBotMenu() {
    try {
      const menuCommands = [];

      // Добавляем только основные команды (без алиасов)
      for (const [name, command] of this.commands) {
        menuCommands.push({
          command: name,
          description: command.info.description || "No description",
        });
      }

      // Регистрируем команды в меню бота (перезаписываем старые)
      console.log("📝 Регистрирую команды...");
      const result = await this.client.telegram.callApi("setMyCommands", {
        commands: menuCommands,
      });

      console.log(
        `\n✅ Команды зарегистрированы в меню бота (${menuCommands.length} всего)`,
      );
      console.log("Результат API:", result);
    } catch (error) {
      console.error("❌ Ошибка при регистрации команд в меню:", error.message);
      console.error("Full error:", error);
    }
  }

  /**
   *
   * @param {String} name
   * @returns {Command|null}
   */
  getCommand(name) {
    // Проверяем прямое имя команды
    if (this.commands.has(name)) {
      return this.commands.get(name);
    }

    // Проверяем алиасы
    if (this.aliases.has(name)) {
      const commandName = this.aliases.get(name);
      return this.commands.get(commandName);
    }

    return null;
  }

  /**
   *
   * @returns Map<String, Command>
   */
  getAllCommands() {
    return this.commands;
  }

  /**
   *
   * @param {String} name
   * @returns {Boolean}
   */
  unloadCommand(name) {
    const command = this.getCommand(name);
    if (command) {
      this.commands.delete(command.name);
      this.client.command[command.name].delete();
      // Удаляем алиасы
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias) => this.aliases.delete(alias));
      }
      console.log(`🛑 Команда отключена: ${command.name}`);
      return true;
    }
    return false;
  }

  /**
   *
   * @param {String} category
   * @returns Array<Command>|null
   */
  getCommandsByCategory(category) {
    return Array.from(this.commands.values()).filter(
      (cmd) => cmd.category === category,
    );
  }

  // Проверка прав доступа и выполнение команды
  /**
   *
   * @param {Command} command
   * @param {Context} ctx
   * @returns
   */
  async executeCommand(command, ctx) {
    const userId = this.getUserId(ctx);
    const isOwner = config.owner && userId === config.owner;
    const isAdmin = config.admins.includes(userId);

    // Проверяем права доступа
    if (command.config.permission && command.config.permission > 0) {
      if (command.config.permission === 2 && !isOwner) {
        // Команда только для владельца
        return ctx.reply(`❌ Эта команда доступна только владельцу бота.`);
      } else if (command.config.permission === 1 && !isOwner && !isAdmin) {
        // Команда для администраторов и владельца
        return ctx.reply(`❌ Эта команда доступна только администраторам.`);
      }
    }

    try {
      await command.execute(ctx);
    } catch (error) {
      console.error(
        `❌ Ошибка при выполнении команды ${command.info.name}:`,
        error,
      );
      ctx.reply(`❌ Произошла ошибка при выполнении команды`);
    }
  }

  // Получить ID пользователя (для вывода админам)
  /**
   *
   * @param {Context} ctx
   * @returns {number|undefined}
   */
  getUserId(ctx) {
    return ctx.from?.id;
  }
}
