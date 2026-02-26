/**
 * Event.ts - Базовый класс для событий
 */

import type { CallbackContext, IEvent } from "@app-types/index.js";
import type BotClient from "@core/Client.js";
import type { FilterQuery } from "grammy";


/**
 * Абстрактный класс для всех событий
 */
export abstract class BaseEvent implements IEvent {
	protected client: BotClient;
	public name: FilterQuery;
	public once: boolean;
	public info: {
		name: string;
	};

	/**
	 * Конструктор события
	 * @param client - экземпляр BotClient
	 * @param name - имя события
	 * @param once - одноразовое ли событие
	 */
	constructor(client: BotClient, name: FilterQuery, once: boolean = false) {
		this.client = client;
		this.name = name;
		this.once = once;
		this.info = { name };
	}

	/**
	 * Абстрактный метод execute - должен быть переопределён
	 * @param ctx - контекст Telegraf
	 */
	abstract execute(ctx: CallbackContext): Promise<void>;
}
