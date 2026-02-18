import { SessionContext, PermissionLevel } from "../types/index.js";
import BotClient from "../core/Client.js";
import { NextFunction } from "grammy";
import config from "../config.js";

export function createCommandHandler(client: BotClient) {
	return async (ctx: SessionContext, next: NextFunction): Promise<void> => {
		// Игнорируем, если нет текста в сообщении
		if (!ctx.message?.text) {
			return next();
		}

		// Пропускаем, если пользователь в сцене
		if ((ctx as any).session?.currentScene) {
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

		const command = client.commandManager.commands.get(commandName) ||
			client.commandManager.commands.get(client.commandManager.aliases.get(commandName) || "");

		if (command) {
			// Проверка прав доступа
			const userId = ctx.from?.id;
			const isOwner = config.owner && userId === config.owner;
			const isAdmin = config.admins && config.admins.includes(userId || 0);

			if (command.config.permission && command.config.permission > PermissionLevel.User) {
				if (command.config.permission === PermissionLevel.Owner && !isOwner) {
					return void (await ctx.reply(`❌ Эта команда доступна только владельцу бота.`));
				} else if (command.config.permission === PermissionLevel.Admin && !isOwner && !isAdmin) {
					return void (await ctx.reply(`❌ Эта команда доступна только администраторам.`));
				}
			}

			console.log(`[CommandHandler] Executing command "${command.info.name}" for user ${ctx.from?.id}`);
			try {
				await command.execute(ctx, args);
			} catch (error) {
				console.error(`[CommandHandler] Error executing command "${command.info.name}":`, error);
				await ctx.reply("❌ Произошла ошибка при выполнении команды.");
			}
		} else {
			return next();
		}
	};
}
