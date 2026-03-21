import mongoose from "mongoose";
export * from "./user.js";
export * from "./account.js";
export * from "./address.js";
export * from "./utilitiesReading.js";
export * from "./tariff.js";
export * from "./userAddress.js";
export * from "./fixedFee.js";
export * from "./reminder.js";

export async function initializeDatabase(): Promise<void> {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error("MONGODB_URL не установлена!");
    }

    // Настройка слушателей событий перед подключением
    mongoose.connection.on("connected", () => {
      console.log("✅ Подключение к БД успешно установлено.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Ошибка подключения к БД:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ Потеряно соединение с БД. Mongoose попытается переподключиться...");
    });

    await mongoose.connect(mongoUrl as string);

  } catch (error) {
    console.error("❌ Критическая ошибка при инициализации подключения к БД. Бот не может продолжить работу.", error);
    throw error;
  }
}
