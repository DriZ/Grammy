import { Types } from "mongoose";
import { Account, Tariff, UtilitiesReading } from "../models/index.js";

export async function deleteAccount(accountId: Types.ObjectId) {
	await Tariff.deleteMany({ account_id: accountId });
	await UtilitiesReading.deleteMany({ account_id: accountId });
	await Account.findByIdAndDelete(accountId);
}
