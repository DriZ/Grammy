import dotenv from "dotenv/config.js";
import BotClient from "./core/Client.js";
import { initializeDatabase, mongoose } from "./models/index.js";
import { GrammyError, HttpError } from "grammy";
dotenv

function logStartup(): void {
	console.log("🚀 Запуск приложения...");
	console.log("📋 TOKEN установлен:", !!process.env.TOKEN);
}

async function main(): Promise<void> {
	logStartup();

	const token = process.env.TOKEN;
	if (!token) {
		throw new Error("❌ TOKEN переменная окружения не установлена!");
	}

	await initializeDatabase();

	const bot = new BotClient(token);
	await bot.initialize();
	bot.launchBot();

	bot.catch((err) => {
		const ctx = err.ctx;
		console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
		const e = err.error;
		if (e instanceof GrammyError) {
			console.error("Ошибка в запросе:", e.description);
		} else if (e instanceof HttpError) {
			console.error("Не удалось связаться с Telegram:", e);
		} else {
			console.error("Неизвестная ошибка:", e);
		}
	});

	process.once("SIGINT", async () => {
		bot.stopBot("SIGINT");
		await mongoose.connection.close();
	});
	process.once("SIGTERM", async () => {
		bot.stopBot("SIGTERM");
		await mongoose.connection.close();
	});
}

main().catch((err) => {
	console.error("❌ Критическая ошибка:", err.stack);
	process.exit(1);
});