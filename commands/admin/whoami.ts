import Command from "../../core/structures/Command.js";
import { PermissionLevel, type BaseContext } from "../../types/index.js";
import type BotClient from "../../core/Client.js";

export default class WhoamiCommand extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: "whoami",
			category: "General",
			usage: "/whoami",
			aliases: ["whois"],
			enabled: true,
			location: null,
			description: "Показать информацию о себе",
			permission: PermissionLevel.Admin,
		});
	}

	async execute(ctx: BaseContext): Promise<void> {
		const user = ctx.from!;

		const info = `
👤 **Твоя информация:**
├ ID: \`${user.id}\`
├ Имя: ${user.first_name}
${user.last_name ? `├ Фамилия: ${user.last_name}` : ""}
├ Username: ${user.username ? `@${user.username}` : "Не установлено"}
└ Статус: ✅ Администратор
    `.trim();

		await ctx.reply(info, { parse_mode: "Markdown" });
	}
}
