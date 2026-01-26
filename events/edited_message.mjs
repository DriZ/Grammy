import Event from "../structures/Event.mjs";

export default class EditedMessageEvent extends Event {
    constructor(client, name) {
		super(client);
        this.client = client;
		this.name = name;
    }

    async execute(ctx) {
        if (!ctx.editedMessage) {
            console.warn(`⚠️  edited_message сработало, но ctx.editedMessage не найдено`);
            console.log(`   Available ctx keys:`, Object.keys(ctx).filter(k => !k.startsWith('_')));
            return;
        }

        console.log(`📝 Сообщение отредактировано от ${ctx.from?.first_name}:`);
        console.log(`   Текст: ${ctx.editedMessage?.text || "N/A"}`);
        
        // Пример: можно ответить на редактирование
        // await ctx.reply("Я видел, что ты отредактировал сообщение!");
    }
};

