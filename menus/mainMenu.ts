import { BaseContext, Menu } from "../types/index.js";

const mainMenu: Menu = {
	id: "main-menu",
	callback: "main-menu",
	inline: false,
	title: "👋 Привет! Выберите действие:",
	buttons: [
		{
			text: "🏠 Коммунальные",
			nextMenu: "utilities-menu",
			callback: "utilities-menu",
		},
		{
			text: "📡 Пинг",
			callback: "ping",
			action: async (ctx) => {
				const command = ctx.services.commandManager.commands.get("ping");
				if (!command) {
					return ctx.callbackQuery.message?.editText("Команда ping не найдена.");
				}
				return command.execute(ctx as BaseContext);
			},
		},
		{
			text: "👤 Обо мне",
			callback: "whoami",
			action: async (ctx) => {
				const command = ctx.services.commandManager.commands.get("whoami");
				if (!command) {
					return ctx.callbackQuery.message?.editText("Команда ping не найдена.");
				}
				return command.execute(ctx as BaseContext);
			},
		},
		{
			text: "🆔 Мой айди",
			callback: "myid",
			action: async (ctx) => {
				const command = ctx.services.commandManager.commands.get("myid");
				if (!command) {
					return ctx.callbackQuery.message?.editText("Команда ping не найдена.");
				}
				return command.execute(ctx as BaseContext);
			},
		},
	],
};
export default mainMenu;
