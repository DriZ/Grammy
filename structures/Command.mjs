import { Context } from "telegraf";
import BotClient from "./Client.mjs";

export default class Command {
    /**
     * 
     * @param {BotClient} client 
     * @param {Object{name: String, description: String, aliases: Array<String>, category: String, usage: String, permission: Number, location: String, enabled: Boolean}} options
     */
    constructor(client, {
        name = null, 
        description = "No description provided", 
        aliases = [], 
        category = "General", 
        usage = `/${this.name}`, 
        permission = 0,
        location = null,
		enabled = true
    }) {
        this.client = client;
        this.config = { permission, location, enabled };
        this.info = { name, description, aliases, category, usage };
    }

    /**
     * 
     * @param {Context} ctx 
     */
    async execute(ctx) {
        throw new Error(`Execute method not implemented for command: ${this.name}`);
    }

	/** 
	 * 
	 * @param {Context} ctx 
	 */
	async reload(ctx) {
		let msg = ctx ? await ctx.reply("♻️ Перезагрузка команды...") : null;
		await this.client.util.sleep(500);
		const commandPath = this.config.location;
		if (!commandPath) {
			msg.editMessageText("❌ Не удалось перезагрузить команду: путь к файлу не найден.");
			throw new Error(`Cannot reload command ${this.info.name}: file path not found.`);
		}

		await this.client.util.sleep(500);
		await msg?.editMessageText("♻️ Выгружаю команду...");
		await this.client.commandHandler.unloadCommand(this.info.name);
		await this.client.util.sleep(500);
		await msg?.editMessageText("♻️ Выгружено. Загружаю команду...");
		await this.client.commandHandler.loadCommand(commandPath);


		// Copy over the properties from the new instance to this instance
		this.info = newCommandInstance.info;
		this.config = newCommandInstance.config;

		console.log(`✅ Command reloaded: ${this.info.name}`);
	}
}
