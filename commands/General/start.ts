import { Keyboard } from "grammy";
import BotClient from "../../core/Client.js";
import Command from "../../structures/Command.js";
import { CallbackContext, PermissionLevel } from "../../types/index.js";
import { User } from "../../models/index.js";

export default class extends Command {
	public client: BotClient;

	constructor(client: BotClient) {
		super(client, {
			name: "start",
			category: "General",
			usage: "/start",
			aliases: [],
			enabled: true,
			location: null,
			description: "",
			permission: PermissionLevel.User,
			showInMenu: false,
		})
		this.client = client
	}

	async execute(ctx: CallbackContext): Promise<void> {
		await ctx.msg?.delete();
		const mainMenu = this.client.menuHandler.menus.get("main-menu"); 
		if (!mainMenu) { 
			await ctx.reply("❌ Главное меню не найдено.");
			return
		} 
		const keyboard = new Keyboard(); 
		mainMenu.buttons.forEach((b) => keyboard.text(b.text).row()); 
		keyboard.text("🤖 Команды").row();
		
		let user = await User.findOne({ telegram_id: ctx.from?.id});
		if (!user) User.create({ telegram_id: ctx.from?.id, name: ctx.from?.first_name });

		await ctx.reply(mainMenu.title, { reply_markup: keyboard.resized() });
		return
	}
}