import { InlineKeyboard } from "grammy";
import type BotClient from "@core/Client.js";
import { BaseCommand } from "@core/structures/BaseCommand.js";
import { type CallbackContext, EPermissionLevel } from "@app-types/index.js";
import { User } from "@models/index.js";


export default class extends BaseCommand {
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
			permission: EPermissionLevel.User,
			showInMenu: false,
		});
		this.client = client;
	}

	async execute(ctx: CallbackContext): Promise<void> {
		await ctx.msg?.delete();
		const mainMenu = this.client.menuManager.menus.get("main-menu");
		if (!mainMenu) {
			await ctx.reply(ctx.t("main-menu.not-found"));
			return;
		}

		const keyboard = new InlineKeyboard();
		const buttons = typeof mainMenu.buttons === "function" ? await mainMenu.buttons(ctx) : mainMenu.buttons;
		for (const b of buttons) {
      const buttonText = await ctx.resolveText(b.text);
      keyboard.text(buttonText, b.callback || b.nextMenu || "noop").row();
    }
		keyboard.text(ctx.t("main-menu.button-commands")).row();

		if (ctx.from) {
			const user = await User.findOne({ telegram_id: ctx.from.id });
			if (!user) {
				await User.create({
					telegram_id: ctx.from.id,
					language: await ctx.i18n.getLocale(),
				});
			}
		}

		await ctx.reply(await ctx.resolveText(mainMenu.title), { reply_markup: keyboard, parse_mode: "Markdown" });
		return;
	}
}
