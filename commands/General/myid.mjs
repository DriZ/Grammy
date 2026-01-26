import Command from "../../structures/Command.mjs";

export default class extends Command {
    constructor(client) {
        super(client, {
            name: "myid",
            description: "Получить твой ID",
            aliases: ["id", "getid"]
        });
    }

    async execute(ctx) {
        const userId = ctx.from?.id;
        await ctx.reply(`🆔 Твой ID: <code>${userId}</code>`, { parse_mode: "HTML" });
    }
};
