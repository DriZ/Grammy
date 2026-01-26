import Event from "../structures/Event.mjs";

export default class MessageEvent extends Event {
    constructor(client, name) {
        super(client);
		this.client = client;
        this.name = name;
    }

    async execute(ctx) {
        if (ctx.message?.text) {
            console.log(`💬 Новое сообщение от ${ctx.from.first_name}: ${ctx.message.text}`);
        }
    }
};
