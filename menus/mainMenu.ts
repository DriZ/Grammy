import type { BaseContext, IMenuButton } from "../types/index.js";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";

export default class MainMenu extends BaseMenu {
	constructor(client: BotClient) {
		super(client, "main-menu");
		this.inline = true;
	}

	get title() {
		return async (ctx: BaseContext) => ctx.t("main-menu.title");
	}

	get buttons(): IMenuButton[] {
		return [
			{
				text: (ctx) => ctx.t("utilities-menu.title"),
				nextMenu: "utilities-menu",
				callback: "utilities-menu",
        row: true,
			},
			{
				text: (ctx) => ctx.t("button.change-language"),
				callback: "language-menu",
				nextMenu: "language-menu",
        row: true,
			},
			{
				text: (ctx) => ctx.t("main-menu.button-ping"),
				callback: "ping",
				action: async (ctx) => this.execCommand(ctx, "ping"),
        row: true,
			},
			{
				text: (ctx) => ctx.t("main-menu.button-whoami"),
				callback: "whoami",
				action: async (ctx) => this.execCommand(ctx, "whoami"),
        row: true,
			}
		];
	}

	private async execCommand(ctx: BaseContext, cmdName: string) {
		const command = ctx.services.commandManager.commands.get(cmdName);
		if (!command) {
			return ctx.callbackQuery?.message?.editText(ctx.t("error.command-not-found", { name: cmdName }));
		}
		return command.execute(ctx);
	}
}
