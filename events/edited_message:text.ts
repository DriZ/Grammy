/**
 * edited_message.ts - Событие для обработки отредактированных сообщений
 */

import Event from "../structures/Event.js";
import type BotClient from "../core/Client.js";
import { SessionContext } from "../types/index.js";
import { FilterQuery } from "grammy";

/**
 * Событие редактирования сообщений
 */
export default class EditedMessageEvent extends Event {
	constructor(client: BotClient, name: FilterQuery) {
		super(client, name);
	}

	/**
	 * Выполнить событие
	 * @param ctx - контекст Telegraf
	 */
	async execute(ctx: SessionContext): Promise<void> {
		// Пропускаем обработку если пользователь находится в сцене
		const currentScene = (ctx as any).session?.__scenes?.current;
		if (currentScene) {
			// Пусть сцена обработает сообщение
			return;
		}

		// Проверяем, пришла ли информация об отредактированном сообщении
		if (!ctx.editedMessage) {
			console.warn(`⚠️  edited_message сработало, но ctx.editedMessage не найдено`);
			console.log(
				`   Available ctx keys:`,
				Object.keys(ctx).filter((k) => !k.startsWith("_")),
			);
			return;
		}

		const editedText = "text" in ctx.editedMessage ? (ctx.editedMessage as any).text : "N/A";
		console.log(`📝 Сообщение отредактировано от ${ctx.from?.first_name}:`);
		console.log(`   Текст: ${editedText}`);
	}
}
