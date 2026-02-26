import type BotClient from "@core/Client.js";
import { BaseCommand } from "@structures/index.js";
import { glob } from "glob";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";


export class CommandManager {
	public client: BotClient;
	public commands: Map<string, BaseCommand>;
	public aliases: Map<string, string>;

	constructor(client: BotClient) {
		this.client = client;
		this.commands = new Map();
		this.aliases = new Map();
	}

	async loadCommands() {
		console.log("[CommandManager] Загружаю команды...");
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const commandsPath = path.join(__dirname, "..", "..", "commands");
		console.log(`[CommandManager] Searching in: ${commandsPath}`);
		const commandFiles = await glob(`**/*.js`, { cwd: commandsPath });
		console.log(`[CommandManager] Found ${commandFiles.length} files.`);

		await Promise.all(
			commandFiles.map(async (file) => {
				const filePath = path.join(commandsPath, file);
				const fileUrl = pathToFileURL(filePath).href;

				try {
					const module = await import(fileUrl);
					const CommandClass = module.default;

					if (CommandClass && CommandClass.prototype instanceof BaseCommand) {
						const command = new CommandClass(this.client);
						command.config.location = filePath;

						if (command.info.name) {
							this.commands.set(command.info.name.toLowerCase(), command);
							console.log(`[CommandManager] Команда загружена: ${command.info.name}`);

							if (command.info.aliases && command.info.aliases.length > 0) {
								command.info.aliases.forEach((alias: string) =>
									this.aliases.set(alias.toLowerCase(), command.info.name),
								);
							}
						} else {
							console.warn(
								`[CommandManager] ⚠️ Skipped ${file}: Command has no name.`,
							);
						}
					} else {
						console.warn(
							`[CommandManager] ⚠️ Skipped ${file}: Not a Command subclass or no default export.`,
						);
					}
				} catch (error) {
					console.error(
						`[CommandManager] Ошибка при загрузке команды из файла ${file}:`,
						error,
					);
				}
			}),
		);
		console.log(`[CommandManager] Загружено ${this.commands.size} команд.`);
	}

	async registerBotCommands() {
		const commandList = Array.from(this.commands.values()).map((cmd) => ({
			command: cmd.info.name.toLowerCase(),
			description: cmd.info.description || "Нет описания",
		}));

		try {
			await this.client.api.setMyCommands(commandList);
			console.log("[CommandManager] Команды зарегистрированы в меню бота.");
		} catch (error) {
			console.error("[CommandManager] Ошибка при регистрации команд в меню бота:", error);
		}
	}

	unloadCommand(commandName: string) {
		const command = this.commands.get(commandName);
		if (command) {
			if (command.info.aliases) {
				command.info.aliases.forEach((alias) => this.aliases.delete(alias));
			}
			this.commands.delete(commandName);
		}
	}

	async loadCommand(commandPath: string) {
		try {
			const fileUrl = `${pathToFileURL(commandPath).href}?update=${Date.now()}`;
			const module = await import(fileUrl);
			const CommandClass = module.default;
			if (CommandClass && CommandClass.prototype instanceof BaseCommand) {
				const command = new CommandClass(this.client) as BaseCommand;
				command.config.location = commandPath;
				if (command.info.name) {
					this.commands.set(command.info.name.toLowerCase(), command);
					if (command.info.aliases)
						command.info.aliases.forEach((alias) =>
							this.aliases.set(alias.toLowerCase(), command.info.name),
						);
				}
			}
		} catch (error) {
			console.error(
				`[CommandManager] Ошибка при загрузке команды из файла ${commandPath}:`,
				error,
			);
		}
	}
}
