import { Types } from "mongoose";
import { UserAddress, Address, Account, Tariff, UtilitiesReading } from "../models/index.js";

export async function deleteAddress(addressId: Types.ObjectId, telegramId?: number) {
	const userAddresses = await UserAddress.find({ address_id: addressId });

	if (userAddresses.length === 0) {
		throw new Error("Адрес не найден или не связан с пользователями.");
	}

	if (userAddresses.length === 1) {
		await UserAddress.findOneAndDelete({ address_id: addressId });
		await Address.findByIdAndDelete(addressId);

		const accounts = await Account.find({ address_id: addressId });
		const accIds = accounts.map((acc) => acc._id);

		await Account.deleteMany({ address_id: addressId });
		if (accIds.length > 0) {
			await Tariff.deleteMany({ account_id: { $in: accIds } });
			await UtilitiesReading.deleteMany({ account_id: { $in: accIds } });
		}

		return { deletedAll: true };
	} else {
		if (!telegramId) {
			throw new Error("Нужен telegramId для удаления связи пользователя.");
		}
		await UserAddress.findOneAndDelete({ telegram_id: telegramId, address_id: addressId });
		return { deletedAll: false };
	}
}
