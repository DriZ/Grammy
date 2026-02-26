import type BotClient from "@core/Client.js";
import { BaseCommand } from "@structures/index.js";
import { type CallbackContext, EPermissionLevel } from "@app-types/index.js";


export default class extends BaseCommand {
	public readonly client: BotClient;

	constructor(client: BotClient) {
		super(client, {
			enabled: false,
			description: "Прочитать данные из Excel файла",
			aliases: ["re", "readxls"],
			name: "readExcel",
			permission: EPermissionLevel.User
		});
		this.client = client;
	}

	async execute(ctx: CallbackContext): Promise<void> {
		if (!ctx.callbackQuery.message?.text) return
		const shareLink = ctx.callbackQuery.message.text.split(" ")[1];
		if (!shareLink) {
			await ctx.reply(
				"❗ Пожалуйста, предоставьте ссылку для общего доступа к Excel файлу.",
			);
			return
		}
		const msg = await ctx.reply("⏳ Чтение данных из Excel файла...");
		console.log(this.client.utils.formatDate(new Date()));
		const token = await this.client.utils.getToken();
		console.log(token);
		const itemId = await this.client.utils.getItemId(token, shareLink);
		if (!itemId) {
			await msg.editText(
				"❗ Не удалось получить Item ID из предоставленной ссылки. Убедитесь, что ссылка правильная.",
			);
			return
		}

		const excelData = await this.client.utils.readExcel(token, itemId, "Сокальського 42039");
		if (!excelData) {
			await msg.editText("❗ Не удалось прочитать данные из Excel файла.");
			return
		}

		let responseMessage = "📊 Данные из Excel файла:\n\n";
		for (const row of excelData) {
			responseMessage += row.join("\t") + "\n";
		}
		await msg.editText(responseMessage);
	}
}
