import { connect } from "mongoose";
export * from "./user.js";
export * from "./account.js";
export * from "./address.js";
export * from "./utilitiesReading.js";
export * from "./tariff.js";
export * from "./userAddress.js";

export async function initializeDatabase(): Promise<void> {
	try {
		const mongoUrl = process.env.MONGODB_URL;
		if (!mongoUrl) {
			throw new Error("MONGODB_URL не установлена!");
		}
		await connect(mongoUrl as string);
		console.log("✅ Подключение к БД успешно");
	} catch (error) {
		console.error("❌ Ошибка подключения к БД:", error);
		throw error;
	}
}
