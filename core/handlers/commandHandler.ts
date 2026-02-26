import { type SessionContext, EPermissionLevel } from "@app-types/index.js";
import type BotClient from "@core/Client.js";
import type { NextFunction } from "grammy";
import config from "@root/config.js";


export function createCommandHandler(client: BotClient) {
	return async (ctx: SessionContext, next: NextFunction): Promise<void> => {
		// Игнорируем, если нет текста в сообщении
		if (!ctx.message?.text) {
			return next();
		}

		// Пропускаем, если пользователь в сцене
		if (ctx.session?.currentScene) {
			return next();
		}

		const text = ctx.message.text;
		const prefix = "/"; // Префикс команд

		if (!text.startsWith(prefix)) {
			return next();
		}

		const args = text.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift()?.toLowerCase();

		if (!commandName) {
			return next();
		}

		const command =
			client.commandManager.commands.get(commandName) ||
			client.commandManager.commands.get(
				client.commandManager.aliases.get(commandName) || "",
			);

		if (command) {
			// Проверка прав доступа
			const userId = ctx.from?.id;
			const isOwner = config.owner && userId === config.owner;
			const isAdmin = config.admins && config.admins.includes(userId || 0);

			if (command.config.permission && command.config.permission > EPermissionLevel.User) {
				if (command.config.permission === EPermissionLevel.Owner && !isOwner)
					return void (await ctx.reply(ctx.t("error.owner-only")));
				else if (command.config.permission === EPermissionLevel.Admin && !isOwner && !isAdmin)
					return void (await ctx.reply(ctx.t("error.admin-only")));
			}

			console.log(
				`[CommandHandler] Executing command "${command.info.name}" for user ${userId ?? "unknown"}`,
			);
			try {
				await command.execute(ctx, args);
			} catch (error) {
				console.error(
					`[CommandHandler] Error executing command "${command.info.name}":`,
					error,
				);
				await ctx.reply(ctx.t("error.command-failed"));
			}
		} else {
			return next();
		}
	};
}
