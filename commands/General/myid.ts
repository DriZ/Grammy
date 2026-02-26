import { BaseCommand } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { type BaseContext, EPermissionLevel } from "@app-types/index.js";


export default class MyIdCommand extends BaseCommand {
	constructor(client: BotClient) {
		super(client, {
			name: "myid",
			description: "Получить твой ID",
			aliases: ["id", "getid"],
			category: "General",
			usage: "/myid",
			enabled: true,
			location: null,
			permission: EPermissionLevel.User,
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
