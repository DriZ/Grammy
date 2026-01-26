import { Telegraf } from "telegraf";
import CommandHandler from "./commandHandler.mjs";
import EventHandler from "./eventHandler.mjs";
import utils from "./util.mjs"

export default class BotClient extends Telegraf {
    constructor(token) {
        super(token);

		this.utils = utils;
        this.commandHandler = new CommandHandler(this);
        this.eventHandler = new EventHandler(this);
        
        this.start((ctx) => ctx.reply("Welcome!"));
    }

    async initialize() {
        await this.commandHandler.loadCommands();
        await this.eventHandler.loadEvents();
        await this.commandHandler.registerBotMenu();
    }

    async launchBot() {
        try {
            console.log("🚀 Starting bot...");
            await this.launch();
        } catch (err) {
            console.error("❌ Failed to start bot:", err.message);
            console.error("Full error:", err);
        }
    }
}