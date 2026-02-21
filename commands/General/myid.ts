/**
 * myid.ts - Команда для получения ID пользователя
 */

import Command from "../../core/structures/Command.js";
import type BotClient from "../../core/Client.js";
import { BaseContext, PermissionLevel } from "../../types/index.js";

/**
 * Команда myid - показывает ID пользователя
 *
 * Optional chaining (?.) - одна из ключевых фич TypeScript:
 * const userId = ctx.from?.id;
 * Означает: если ctx.from существует, получить id, иначе undefined
 */
export default class MyIdCommand extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: "myid",
			description: "Получить твой ID",
			aliases: ["id", "getid"],
			category: "General",
			usage: "/myid",
			enabled: true,
			location: null,
			permission: PermissionLevel.User,
		});
	}

	async execute(ctx: BaseContext): Promise<void> {
		// Optional chaining: ctx.from может быть undefined
		const userId = ctx.from?.id;

		await ctx.reply(`🆔 Твой ID: <code>${userId}</code>`, {
			parse_mode: "HTML",
		});
	}
}
