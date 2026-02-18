/**
 * eventHandler.ts - Обработчик событий
 *
 * Похож на CommandHandler, но для событий вместо команд
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CallbackContext } from "../types/index.js";
import Event from "../structures/Event.js";
import BotClient from "./Client.js";
import { FilterQuery } from "grammy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Обработчик событий
 */
export default class EventHandler {
	private client: BotClient;
	private _events: Map<string, Event>;

	/**
	 * Конструктор
	 * @param client - экземпляр BotClient
	 */
	constructor(client: BotClient) {
		this.client = client;
		this._events = new Map();
	}

	/**
	 * Загрузить все события из директории
	 * @param eventsDir - директория с событиями
	 * @returns Map со всеми событиями
	 */
	async loadEvents(
		eventsDir: string = path.join(__dirname, "..", "events"),
	): Promise<Map<string, Event>> {
		// Проверяем, существует ли папка events
		if (!fs.existsSync(eventsDir)) {
			console.warn(`⚠️  Папка events не найдена: ${eventsDir}`);
			return this._events;
		}

		const files = fs.readdirSync(eventsDir).filter((file) => file.endsWith(".js"));

		for (const file of files) {
			const filePath = path.join(eventsDir, file);
			const eventName = file.replace(".js", "");

			try {
				const module = await import(`file://${filePath}`);
				const event = new module.default(this.client, eventName) as Event;

				if (!event.name) {
					console.warn(`⚠️  Событие в файле ${file} не имеет имени. Пропускаю...`);
					continue;
				}

				if (typeof event.execute !== "function") {
					console.warn(`⚠️  Событие ${file} не имеет метода execute(). Пропускаю...`);
					console.log(`   Event object:`, event);
					continue;
				}

				// Регистрируем событие
				this._events.set(event.name, event);

				// Регистрируем событие в Telegraf
				const registerHandler = (handler: (ctx: CallbackContext) => Promise<void>) => {
					this.client.on(event.name, handler as any);
				};

				if (event.once) {
					// Для одноразовых событий используем флаг executed
					let executed = false;
					registerHandler(async (ctx: CallbackContext) => {
						if (executed) return;
						executed = true;
						try {
							console.log(`🔔 Одноразовое событие сработало: ${event.info.name}`);
							await event.execute(ctx);
						} catch (err) {
							console.error(`❌ Ошибка в событии ${event.info.name}:`, err);
						}
					});
					console.log(`✅ Одноразовое событие загружено: ${event.info.name}`);
				} else {
					// Обычное событие (срабатывает каждый раз)
					registerHandler(async (ctx: CallbackContext) => {
						try {
							console.log(`🔔 Событие сработало: ${event.name}`);
							await event.execute(ctx);
						} catch (err) {
							console.error(`❌ Ошибка в событии ${event.name}:`, err);
						}
					});
					console.log(`✅ Событие загружено: ${event.name}`);
				}
			} catch (error) {
				console.error(`❌ Ошибка при загрузке события ${file}:`, error);
			}
		}

		console.log(`\n📦 Всего событий загружено: ${this._events.size}`);
		return this._events;
	}

	/**
	 * Получить событие по имени
	 * @param name - имя события
	 * @returns Event или null
	 */
	getEvent(name: string): Event | null {
		return this._events.get(name) || null;
	}

	/**
	 * Получить все события
	 * @returns Map со всеми событиями
	 */
	getAllEvents(): Map<string, Event> {
		return this._events;
	}
}
