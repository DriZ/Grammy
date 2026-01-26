import Command from "../../structures/Command.mjs";

export default class extends Command {
    constructor(client) {
        super(client, {
            description: "Перезагрузить бота",
            permission: 1,
			aliases: ["r", "restart"]
        });
    }

    async execute(ctx) {
        await ctx.reply("🔄 Перезагружаюсь...");
        setTimeout(() => {
            process.exit(0);
        }, 500);
    }
};
