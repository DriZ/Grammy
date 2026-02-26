import { BaseCommand } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { type BaseContext, EPermissionLevel } from "@app-types/index.js";
import { inspect } from "util";


export default class EvalCommand extends BaseCommand {
	constructor(client: BotClient) {
		super(client, {
			name: "eval",
			description: "Выполнить произвольный JavaScript код",
			category: "Owner",
			permission: EPermissionLevel.Owner,
			usage: "/eval <код>",
			aliases: ["e", "run"],
			showInMenu: false,
		});
	}

	async execute(ctx: BaseContext, args: string[]): Promise<void> {
		if (!args || args.length === 0) {
			await ctx.reply("⚠️ Введите код для выполнения.");
			return;
		}

		const code = args.join(" ");

		try {
			// Выполняем код. Переменные ctx, this.client, args доступны внутри eval
			let evaled;
			if (code.includes("await")) {
				evaled = await eval(`(async () => { ${code} })()`);
			} else {
				evaled = await eval(code);
			}

			// Если результат не строка, инспектируем объект
			if (typeof evaled !== "string") {
				evaled = inspect(evaled, { depth: 1 });
			}

			// Скрываем токен
			if (process.env.TOKEN) {
				evaled = evaled.split(process.env.TOKEN).join("[TOKEN REDACTED]");
			}

			// Экранируем обратные кавычки для Markdown
			// evaled = evaled.replace(/`/g, "`" + String.fromCharCode(8203));

			if (evaled.length > 4000) {
				await ctx.reply(
					`📤 **Результат (обрезан):**\n\`\`\`js\n${evaled.substring(0, 4000)}...\n\`\`\``,
					{ parse_mode: "Markdown" },
				);
			} else {
				await ctx.reply(`📤 **Результат:**\n\`\`\`js\n${evaled}\n\`\`\``, {
					parse_mode: "Markdown",
				});
			}
		} catch (err) {
			let errorMsg = String(err);
			if (process.env.TOKEN) {
				errorMsg = errorMsg.split(process.env.TOKEN).join("[TOKEN REDACTED]");
			}
			await ctx.reply(`❌ **Ошибка:**\n\`\`\`js\n${errorMsg}\n\`\`\``, {
				parse_mode: "Markdown",
			});
		}
	}
}
