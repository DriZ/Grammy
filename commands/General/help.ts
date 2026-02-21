import Command from "../../core/structures/Command.js";
import type BotClient from "../../core/Client.js";
import { BaseContext, PermissionLevel } from "../../types/index.js";
import config from "../../config.js";

export default class HelpCommand extends Command {
	constructor(client: BotClient) {
		super(client, {
			name: "help",
			description: "Показать список команд или информацию о конкретной команде",
			category: "General",
			usage: "/help [команда] или /help [страница]",
			aliases: ["h", "помощь"],
			permission: PermissionLevel.User,
		});
	}

	async execute(ctx: BaseContext, args: string[]): Promise<void> {
		const firstArg = args[0];
		const isPageNumber = firstArg && !isNaN(Number(firstArg));

		// Если передан аргумент и это НЕ число (например, /help ping), показываем инфо о команде
		if (firstArg && !isPageNumber) {
			const commandName = firstArg.toLowerCase();
			const command =
				this.client.commandManager.commands.get(commandName) ||
				this.client.commandManager.commands.get(
					this.client.commandManager.aliases.get(commandName) || "",
				);

			if (!command) {
				await ctx.reply(`❌ Команда "${commandName}" не найдена.`);
				return;
			}

			let info = `📖 **Информация о команде ${command.info.name}**\n\n`;
			info += `📝 **Описание:** ${command.info.description}\n`;
			info += `📂 **Категория:** ${command.info.category}\n`;
			info += `⌨️ **Использование:** \`${command.info.usage}\`\n`;
			if (command.info.aliases && command.info.aliases.length > 0) {
				info += `🔗 **Алиасы:** ${command.info.aliases.join(", ")}\n`;
			}

			const permLevel = command.config.permission;
			let permText = "Все";
			if (permLevel === PermissionLevel.Admin) permText = "Администратор";
			if (permLevel === PermissionLevel.Owner) permText = "Владелец";
			info += `🔒 **Доступ:** ${permText}`;

			await ctx.reply(info, { parse_mode: "Markdown" });
			return;
		}

		// Логика пагинации
		const page = isPageNumber ? Math.max(1, parseInt(firstArg)) : 1;
		const COMMANDS_PER_PAGE = 8;

		const userId = ctx.from?.id;
		const isOwner = config.owner && userId === config.owner;
		const isAdmin = config.admins && config.admins.includes(userId || 0);

		// Определяем уровень прав пользователя
		let userPerm = PermissionLevel.User;
		if (isAdmin) userPerm = PermissionLevel.Admin;
		if (isOwner) userPerm = PermissionLevel.Owner;

		// Получаем все команды и фильтруем по правам
		const commands = Array.from(this.client.commandManager.commands.values()).filter(
			(cmd) => cmd.config.permission <= userPerm,
		);

		// Сортируем: сначала по категории, потом по имени
		commands.sort((a, b) => {
			if (a.info.category > b.info.category) return 1;
			if (a.info.category < b.info.category) return -1;
			return a.info.name.localeCompare(b.info.name);
		});

		const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE) || 1;
		const currentPage = Math.min(page, totalPages);
		const start = (currentPage - 1) * COMMANDS_PER_PAGE;
		const end = start + COMMANDS_PER_PAGE;
		const commandsOnPage = commands.slice(start, end);

		let message = `🤖 **Список команд (Страница ${currentPage}/${totalPages}):**\n\n`;
		let lastCategory = "";

		for (const cmd of commandsOnPage) {
			if (cmd.info.category !== lastCategory) {
				message += `📂 **${cmd.info.category}**\n`;
				lastCategory = cmd.info.category;
			}
			message += `• \`/${cmd.info.name}\` — ${cmd.info.description}\n`;
		}

		message += "\n💡 Используйте `/help [команда]` для подробной информации.";
		if (totalPages > 1) {
			message += `\n📄 Страницы: \`/help [номер]\``;
		}

		await ctx.reply(message, { parse_mode: "Markdown" });
	}
}
