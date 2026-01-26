import Command from "../../structures/Command.mjs";
import { Context } from "telegraf";

export default class extends Command {
    constructor(client) {
        super(client, {
            description: "Проверить скорость отклика бота",
            aliases: ["p", "pong"]
        });
    }

    /**
     * 
     * @param {Context} ctx 
     */
    async execute(ctx) {
        const sent = await ctx.reply("Pong! 🏓");
        const latency = sent.message_id - ctx.message.message_id;
        ctx.reply(`Latency: ${latency}ms`);
    }
};
