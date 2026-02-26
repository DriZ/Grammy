import { BaseCommand } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { type BaseContext, EPermissionLevel } from "@app-types/index.js";


export default class RebootCommand extends BaseCommand {
	constructor(client: BotClient) {
		super(client, {
			name: "reboot",
			category: "Owner",
			usage: "/reboot",
			enabled: true,
			location: null,
			description: "Перезагрузить бота",
			permission: EPermissionLevel.Owner,
			aliases: ["r", "restart"],
		});
	}

	/**
	 * Выполнить команду
	 */
	async execute(ctx: BaseContext): Promise<void> {
		// Отправляем уведомление
		await ctx.reply("🔄 Перезагружаюсь...");

		// Даём время на отправку сообщения, потом выходим из процесса
		// process.exit(0) - выход с кодом 0 (успешно)
		// PM2 или другой процесс-менеджер перезапустит бота
		setTimeout(() => {
			process.exit(0);
		}, 500);
	}
}
