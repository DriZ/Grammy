import { Account, Tariff, UtilitiesReading } from "../models/index.js";

export async function deleteAccount(accountId: string) {
	await Tariff.deleteMany({ account_id: accountId });
	await UtilitiesReading.deleteMany({ account_id: accountId });
	await Account.findByIdAndDelete(accountId);
}
