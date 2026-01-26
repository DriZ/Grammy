import { Context } from "telegraf";

export default class Event {
    constructor(client, name = null, once = false) {
        this.client = client;
        this.name = name;
		this.once = once;
    }

    /**
     * @param {Context} ctx
     */
    async execute(ctx) {
        throw new Error(`Execute method not implemented for event: ${this.info.name}`);
    }
}
