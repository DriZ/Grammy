import { CallbackContext } from "../types";
import BotClient from "./Client";

type Handler<C> = (ctx: C, id?: string) => Promise<void>;

export class ActionRouter<C extends CallbackContext> {
	private routes: Map<string, Handler<C>> = new Map();
	public readonly client: BotClient;

	constructor(client: BotClient) {
		this.client = client;
	}

	register(prefix: string, handler: Handler<C>) {
		this.routes.set(prefix, handler);
	}

	async handle(ctx: C) {
		const data = ctx.callbackQuery.data;

		for (const [prefix, handler] of this.routes.entries()) {
			if (data === prefix) {
				return handler(ctx);
			}
			if (data.startsWith(prefix + "-")) {
				const id = data.slice(prefix.length + 1);
				return handler(ctx, id);
			}
		}

		// fallback: меню навигация
		const menu = this.client.menuHandler.getMenu(data);
		if (menu) {
			if (menu.action) return menu.action(ctx);
			return this.client.menuHandler.showMenu(ctx, menu.id);
		}

		await ctx.answerCallbackQuery({ text: "❌ Неизвестное действие" });
	}
}
