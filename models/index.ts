import mongoose from "mongoose";
import { User, IUser } from "./user.js";
import { Account, IAccount, MeterType } from "./account.js";
import { Address, IAddress } from "./address.js";
import { UtilitiesReading, IUtilitiesReading, ZoneReading } from "./utilitiesReading.js";
import { Tariff, TariffType, ZoneParams } from "./tariff.js";
import { UserAddress, IUserAddress } from "./userAddress.js";

async function initializeDatabase(): Promise<void> {
	try {
		const mongoUrl = process.env.MONGODB_URL;
		if (!mongoUrl) {
			throw new Error("MONGODB_URL не установлена!");
		}
		await mongoose.connect(mongoUrl as string);
		console.log("✅ Подключение к БД успешно");
	} catch (error) {
		console.error("❌ Ошибка подключения к БД:", error);
		throw error;
	}
}

export {
	mongoose,
	initializeDatabase,
	MeterType,
	ZoneReading,
	Address,
	IAddress,
	User,
	IUser,
	UserAddress,
	IUserAddress,
	Account,
	IAccount,
	UtilitiesReading,
	IUtilitiesReading,
	Tariff,
	TariffType,
	ZoneParams,
};
