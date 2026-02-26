import { BaseCommand } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { type BaseContext, EPermissionLevel } from "@app-types/index.js";


export default class PingCommand extends BaseCommand {
	/**
	 * Конструктор команды
	 */
	constructor(client: BotClient) {
		super(client, {
			name: "ping",
			category: "General",
			usage: "/ping",
			enabled: true,
			location: null,
			permission: EPermissionLevel.User,
			description: "Проверить скорость отклика бота",
			aliases: ["p", "pong"],
		});
	}

	async execute(ctx: BaseContext): Promise<void> {
		const sent = await ctx.reply("Pong! 🏓");
		const latency = (sent.message_id || 0) - (ctx.message?.message_id || 0);

		await sent.editText(`Pong! 🏓\nLatency: ${latency}ms`);
	}
}
