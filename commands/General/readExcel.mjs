import Command from "../../structures/Command.mjs";

export default class extends Command {
	constructor(client) {
		super(client, {
			description: "Прочитать данные из Excel файла",
			aliases: ["re", "readxls"],
			enabled: false,
		});
		this.client = client;
	}

	async execute(ctx) {
		const shareLink = ctx.message?.text?.split(" ")[1];
		if (!shareLink) {
			return await ctx.reply("❗ Пожалуйста, предоставьте ссылку для общего доступа к Excel файлу.");
		}
		
		const token = await this.client.utils.getToken();
		const itemId = await this.client.utils.getItemId(token, shareLink);
		if (!itemId) {
			return await ctx.reply("❗ Не удалось получить Item ID из предоставленной ссылки. Убедитесь, что ссылка правильная.");
		}

		const excelData = await this.client.utils.readExcel(token, itemId, "Сокальського 42039");
		if (!excelData) {
			return await ctx.reply("❗ Не удалось прочитать данные из Excel файла.");
		}

		let responseMessage = "📊 Данные из Excel файла:\n\n";
		for (const row of excelData) {
			responseMessage += row.join("\t") + "\n";
		}
		await ctx.reply(responseMessage);
	}
};