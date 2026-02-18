/**
 * message.ts - Событие для обработки всех входящих сообщений
 *
 * Это событие срабатывает на ВСЕ сообщения, а не только команды
 */

import Event from "../structures/Event.js";
import { SessionContext } from "../types/index.js";
import type BotClient from "../core/Client.js";
import { FilterQuery } from "grammy";

/**
 * События для сообщений
 */
export default class MessageEvent extends Event {
	constructor(client: BotClient, name: FilterQuery) {
		// Регистрируем событие только для текстовых сообщений
		super(client, name, false);
	}

	/**
	 * Выполнить событие
	 * @param ctx - контекст Telegraf
	 */
	async execute(ctx: SessionContext): Promise<void> {
		// Пропускаем обработку если пользователь находится в сцене
		const currentScene = (ctx as any).session?.currentScene;

		if (currentScene) {
			// Пусть сцена обработает сообщение
			return;
		}

		// Проверяем, есть ли текст в сообщении
		if ("message" in ctx && ctx.message && "text" in ctx.message) {
			const messageText = (ctx.message as any).text;
			console.log(`💬 Новое сообщение от ${ctx.from?.first_name}: ${messageText}`);
		}
	}
}
