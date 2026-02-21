import { BaseContext, Menu } from "../types/index.js";

const mainMenu: Menu = {
	id: "main-menu",
	callback: "main-menu",
	inline: false,
	title: (ctx) => ctx.t("main-menu-title"),
	buttons: [
		{
			text: (ctx) => ctx.t("utilities"),
			nextMenu: "utilities-menu",
			callback: "utilities-menu",
		},
		{
			text: (ctx) => ctx.t("main-menu-button-ping"),
			callback: "ping",
			action: async (ctx) => {
				const command = ctx.services.commandManager.commands.get("ping");
				if (!command) {
					return ctx.callbackQuery.message?.editText(ctx.t("command-not-found", { name: "ping" }));
				}
				return command.execute(ctx as BaseContext);
			},
		},
		{
			text: (ctx) => ctx.t("main-menu-button-whoami"),
			callback: "whoami",
			action: async (ctx) => {
				const command = ctx.services.commandManager.commands.get("whoami");
				if (!command) {
					return ctx.callbackQuery.message?.editText(ctx.t("command-not-found", { name: "whoami" }));
				}
				return command.execute(ctx as BaseContext);
			},
		},
		{
			text: (ctx) => ctx.t("main-menu-button-myid"),
			callback: "myid",
			action: async (ctx) => {
				const command = ctx.services.commandManager.commands.get("myid");
				if (!command) {
					return ctx.callbackQuery.message?.editText(ctx.t("command-not-found", { name: "myid" }));
				}
				return command.execute(ctx as BaseContext);
			},
		},
	],
};
export default mainMenu;
