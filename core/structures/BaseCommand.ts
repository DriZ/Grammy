/* eslint-disable prefer-const */
import {
	type ICommandInfo,
	type ICommandConfig,
	type ICommandOptions,
	type BaseContext,
	EPermissionLevel,
	type SessionContext,
	type CallbackContext
} from "@app-types/index.js";
import type BotClient from "@core/Client.js";

/**
 * @abstract
 * @class Command
 * @description Абстрактный базовый класс для всех команд бота.
 * Определяет общую структуру и обязательные методы для каждой команды.
 * Нельзя создать экземпляр этого класса напрямую.
 *
 * @example
 * class PingCommand extends Command {
 *   constructor(client: BotClient) {
 *     super(client, { name: 'ping', description: 'Checks bot latency.', permission: PermissionLevel.User });
 *   }
 *
 *   async execute(ctx: BaseContext | SessionContext | CallbackContext) {
 *     await ctx.reply('Pong!');
 *   }
 * }
 */
export abstract class BaseCommand {
	// Типизированные свойства
	protected readonly client: BotClient;
	public info: ICommandInfo;
	public config: ICommandConfig;
	/**
	 * Конструктор команды
	 * @param client - экземпляр BotClient
	 * @param options - опции конфигурации команды
	 */
	constructor(client: BotClient, options: ICommandOptions) {
		this.client = client;
		// Деструктуризация с значениями по умолчанию
		let {
			name = null,
			description = "No description provided",
			aliases = [],
			category = "General",
			usage = null,
			permission = EPermissionLevel.User,
			location = null,
			enabled = true,
			showInMenu = true,
		} = options;

		// Если имя не указано, пытаемся определить его по имени класса
		if (!name) {
			const className = this.constructor.name;
			if (className && className !== "Command") {
				// Удаляем суффикс 'Command' и приводим к нижнему регистру (PingCommand -> ping)
				name = className.replace(/Command$/i, "").toLowerCase();
			}
		}

		// Если usage не указан, генерируем его на основе имени
		if (!usage) {
			usage = `/${name || "command"}`;
		}

		// Инициализируем объекты с правильными типами
		this.config = { permission, location, enabled, showInMenu };
		this.info = {
			name: name || "",
			description,
			aliases,
			category,
			usage,
		};
	}

	/**
	 * Абстрактный метод, который выполняется при вызове команды.
	 * Каждая дочерняя команда ДОЛЖНА реализовать этот метод.
	 *
	 * @abstract
	 * @param {BaseContext | SessionContext | CallbackContext} ctx - Контекст grammY.
	 * @param {string[]} [args] - Аргументы, переданные с командой.
	 * @returns {Promise<void> | void}
	 */
	abstract execute(ctx: BaseContext | SessionContext | CallbackContext, args?: string[]): Promise<void> | void;

	/**
	 * Перезагружает текущую команду.
	 * @param {BaseContext} [ctx] - Контекст для отправки сообщений о статусе перезагрузки.
	 * @returns {Promise<void>}
	 */
	async reload(ctx?: BaseContext | SessionContext | CallbackContext): Promise<void> {
		// Отправляем сообщение о начале перезагрузки
		const msg = ctx ? await ctx.reply("♻️ Перезагрузка команды...") : null;

		// Задержка для визуального эффекта
		await this.client.utils.sleep(500);

		const commandPath = this.config.location;
		if (!commandPath) {
			if (msg && ctx) {
				await ctx.editMessageText(
					"❌ Не удалось перезагрузить команду: путь к файлу не найден.",
				);
			}
			throw new Error(`Cannot reload command ${this.info.name}: file path not found.`);
		}

		// Выгружаем команду
		await this.client.utils.sleep(500);
		if (msg && ctx) {
			await ctx.editMessageText("♻️ Выгружаю команду...");
		}
		this.client.commandManager.unloadCommand(this.info.name);

		// Загружаем команду заново
		await this.client.utils.sleep(500);
		if (msg && ctx) {
			await ctx.editMessageText("♻️ Выгружено. Загружаю команду...");
		}
		await this.client.commandManager.loadCommand(commandPath);

		console.log(`✅ Command reloaded: ${this.info.name}`);
	}
}
