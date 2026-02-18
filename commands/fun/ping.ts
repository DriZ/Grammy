import Command from "../../structures/Command.js";
import type BotClient from "../../core/Client.js";
import { BaseContext, PermissionLevel } from "../../types/index.js";

export default class PingCommand extends Command {
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
			permission: PermissionLevel.User,
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
