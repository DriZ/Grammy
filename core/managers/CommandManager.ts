import type BotClient from "@core/Client.js";
import { BaseCommand } from "@structures/index.js";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { BaseManager } from "./BaseManager.js";
import type { CommandModule } from "@app-types/index.js";


export class CommandManager extends BaseManager {
  public commands: Map<string, BaseCommand>;
  public aliases: Map<string, string>;

  constructor(client: BotClient) {
    super(client);
    this.commands = new Map();
    this.aliases = new Map();
  }

  async loadCommands() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const commandsPath = path.join(__dirname, "..", "..", "commands");

    await this.loadFiles<CommandModule>(commandsPath, "**/*.js", async (module, filePath) => {
      const CommandClass = module.default;

      if (CommandClass && CommandClass.prototype instanceof BaseCommand) {
        const command = new CommandClass(this.client);
        command.config.location = filePath;

        if (command.info.name) {
          this.commands.set(command.info.name.toLowerCase(), command);
          this.log(`✅ Command loaded: ${command.info.name}`);

          if (command.info.aliases && command.info.aliases.length > 0) {
            command.info.aliases.forEach((alias: string) =>
              this.aliases.set(alias.toLowerCase(), command.info.name),
            );
          }
        } else {
          this.warn(`Skipped ${filePath}: Command has no name.`);
        }
      } else {
        this.warn(`Skipped ${filePath}: Not a Command subclass or no default export.`);
      }
    });

    this.log(`✅ Loaded ${this.commands.size} commands.`);
  }

  async registerBotCommands() {
    const commandList = Array.from(this.commands.values()).map((cmd) => ({
      command: cmd.info.name.toLowerCase(),
      description: cmd.info.description || "No description provided.",
    }));

    try {
      await this.client.api.setMyCommands(commandList);
      this.log("✅ Commands registered in telegram API successfully.");
    } catch (error) {
      this.error("Error while registering commands:", error);
    }
  }

  unloadCommand(commandName: string) {
    try {
      const command = this.commands.get(commandName);
      if (command) {
        if (command.info.aliases) {
          command.info.aliases.forEach((alias) => {
            this.aliases.delete(alias);
            this.log(`🗑️ Alias unloaded: ${alias} -> ${command.info.name}`);
          });
        }
        this.commands.delete(commandName);
      }
      this.log(`🗑️ Command unloaded: ${commandName}`);
    } catch (error) {
      this.error(`Error while unloading command ${commandName}:`, error);
    }
  }

  async loadCommand(commandPath: string) {
    const fileUrl = `${pathToFileURL(commandPath).href}?update=${Date.now()}`;
    const module = await this.importModule<CommandModule>(fileUrl);
    if (!module) return;

    const CommandClass = module.default;
    if (CommandClass && CommandClass.prototype instanceof BaseCommand) {
      const command = new CommandClass(this.client) as BaseCommand;
      command.config.location = commandPath;
      if (command.info.name) {
        this.commands.set(command.info.name.toLowerCase(), command);
        if (command.info.aliases)
          command.info.aliases.forEach((alias) => {
            this.aliases.set(alias.toLowerCase(), command.info.name);
            this.log(`✅ Alias loaded: ${alias} -> ${command.info.name}`);
          });
      }
      this.log(`✅ Command loaded: ${command.info.name}`);
    }
  }
}
