import dotenv from "dotenv";
import BotClient from "./structures/Client.mjs";

// Загружаем переменные окружения из .env файла
dotenv.config();

console.log("🚀 Запуск приложения...");
console.log("📋 TOKEN установлен:", !!process.env.TOKEN);

const bot = new BotClient(process.env.TOKEN);

// Инициализируем бота и загружаем команды
await bot.initialize();

bot.launchBot();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
