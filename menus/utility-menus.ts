import { Account, Address, Tariff, UtilitiesReading } from "../models/index.js";
import { CallbackContext, Menu, Resource } from "../types/index.js";
import { InlineKeyboard } from "grammy";

export function makeAddressMenu(addressId: string): Menu {
	return {
		id: `address-${addressId}`, // 👈 совпадает с callback кнопки
		title: "📋 Счета по адресу",
		inline: true,
		buttons: [
			{
				text: "➕ Добавить счёт",
				callback: `create-account-${addressId}`,
				action: async (ctx: CallbackContext) => {
					ctx.wizard.state.addressId = addressId;
					await ctx.services.sceneManager.enter(ctx, "create-account");
				},
			},
			{
				text: "🗑️ Удалить адрес",
				callback: `delete-address-${addressId}`,
				action: async (ctx: CallbackContext) => {
					ctx.wizard.state.addreddId = addressId;
					await ctx.services.sceneManager.enter(ctx, "delete-address");
				},
			},
			{
				text: "⬅️ Назад",
				callback: "utilities-menu",
				nextMenu: "utilities-menu",
			},
		],
		action: async (ctx) => {
			const accounts = await Account.find({ address_id: addressId });
			const address = await Address.findById(addressId);
			if (!address) {
				throw new Error(`Адрес с id ${addressId} не найден`);
			}

			const keyboard = new InlineKeyboard();

			if (accounts.length > 0) {
				accounts.forEach((acc) => {
					const emoji = Resource[acc.resource].emoji;

					ctx.services.menuHandler.registerMenu(
						`account-${acc._id.toString()}`,
						makeAccountMenu(acc._id.toString(), addressId),
					);
					keyboard
						.text(`${emoji} Счёт №${acc.account_number}`, `account-${acc._id}`)
						.row();
				});
			}

			keyboard.text("➕ Добавить счёт", `create-account-${addressId}`).row();
			if (accounts.length === 0)
				keyboard.text("🗑️ Удалить адрес", `delete-address-${addressId}`).row();
			keyboard.text("⬅️ Назад", "utilities-menu");

			const title = `📋 Счета по адресу ${address.name}:`;
			if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
			else await ctx.reply(title, { reply_markup: keyboard });
		},
	};
}

/**
 * 
 * @param accountId
 * @param addressId 
 * @returns 
 */
export function makeAccountMenu(accountId: string, addressId: string): Menu {
	return {
		id: `account-${accountId}`,
		title: "⚡ Меню счёта",
		inline: true,
		buttons: [
			{
				text: "➕ Добавить тариф",
				callback: `create-tariff-${accountId}`,
				action: async (ctx) => {
					ctx.wizard.state.accountId = accountId;
					await ctx.services.sceneManager.enter(ctx, "create-tariff");
				},
			},
			{
				text: "📊 Показания",
				callback: `readings-${accountId}`,
				nextMenu: `readings-${accountId}`,
			},
			{
				text: "🗑️ Удалить счёт",
				callback: `delete-account-${accountId}`,
				action: async (ctx) => {
					ctx.wizard.state.accountId = accountId;
					ctx.wizard.state.addressId = addressId;
					await ctx.services.sceneManager.enter(ctx, "delete-account");
				},
			},
			{
				text: "⬅️ Назад",
				callback: `address-${addressId}`,
				nextMenu: `address-${addressId}`,
			},
		],
		action: async (ctx) => {
			const keyboard = new InlineKeyboard()
				.text("💲 Тарифы", `tariffs-${accountId}`)
				.row()
				.text("🧾 К оплате", `calculate-bill-${accountId}`)
				.row()
				.text("📊 Показания", `readings-${accountId}`)
				.row()
				.text("🗑️ Удалить счёт", `delete-account-${accountId}`).danger()
				.row()
				.text("⬅️ Назад", `address-${addressId}`);

			const account = await Account.findById(accountId);
			if (!account) throw new Error(`Счёт с id ${accountId} не найден`);

			ctx.services.menuHandler.registerMenu(`readings-${accountId}`, makeReadingsMenu(accountId));
			ctx.services.menuHandler.registerMenu(`tariffs-${accountId}`, makeTariffsMenu(accountId));

			const title = `${Resource[account.resource].emoji ?? "⚡️"} Меню счёта №${account.account_number}`;
			if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
			else await ctx.reply(title, { reply_markup: keyboard });
		},
	};
}

export function makeReadingsMenu(accountId: string, year?: number): Menu {
	const menuId = year ? `readings-${accountId}-${year}` : `readings-${accountId}`;
	return {
		id: menuId,
		title: "📊 Показания",
		inline: true,
		buttons: [
			{
				text: "➕ Добавить показания",
				callback: `create-reading-${accountId}`,
				action: async (ctx) => {
					ctx.wizard.state.accountId = accountId;
					await ctx.services.sceneManager.enter(ctx, "create-reading");
				},
			},
			{
				text: "⬅️ Назад",
				callback: `account-${accountId}`,
				nextMenu: `account-${accountId}`,
			},
		],
		action: async (ctx) => {
			let selectedYear = year;
			if (!selectedYear) {
				const latestReading = await UtilitiesReading.findOne({ account_id: accountId }).sort({ year: -1 });
				selectedYear = latestReading ? latestReading.year : new Date().getFullYear();
			}

			const readings = await UtilitiesReading.find({
				account_id: accountId,
				year: selectedYear
			}).sort({
				month: -1,
			});
			const keyboard = new InlineKeyboard();

			// Расчет годового потребления
			let consumptionText = "";
			const prevYearDecReading = await UtilitiesReading.findOne({
				account_id: accountId,
				year: selectedYear - 1,
				month: 12,
			});

			const latestReadingInSelectedYear = await UtilitiesReading.findOne({
				account_id: accountId,
				year: selectedYear,
			}).sort({ month: -1 });

			if (prevYearDecReading && latestReadingInSelectedYear) {
				let totalConsumption = 0;
				for (const currentZone of latestReadingInSelectedYear.zones) {
					const prevZone = prevYearDecReading.zones.find((z) => z.name === currentZone.name);
					if (prevZone) {
						const consumption = currentZone.value - prevZone.value;
						if (consumption >= 0) {
							totalConsumption += consumption;
						}
					}
				}

				if (totalConsumption > 0) {
					const account = await Account.findById(accountId);
					if (account) {
						const unit = account.resource === "electricity" ? "кВт·ч" : "м³";
						consumptionText = ` | Потребление: ${totalConsumption.toFixed(0)} ${unit}`;
					}
				}
			}

			if (readings.length > 0) {
				readings.forEach((r) => {
					ctx.services.menuHandler.registerMenu(
						`reading-${r._id.toString()}`,
						makeReadingMenu(r._id.toString(), accountId),
					);

					// формируем строку из зон
					const zonesStr = r.zones.map((z) => `${z.name}: ${z.value}`).join(", ");
					keyboard
						.text(
							`${r.month.toString().padStart(2, "0")}.${r.year} → ${zonesStr}`,
							`reading-${r._id}`,
						)
						.row();
				});
			}

			// Пагинация по годам
			keyboard
				.text(`⬅️ ${selectedYear - 1}`, `readings-${accountId}-${selectedYear - 1}`)
				.text(`📅 ${selectedYear}`, `readings-${accountId}-${selectedYear}`)
				.text(`${selectedYear + 1} ➡️`, `readings-${accountId}-${selectedYear + 1}`)
				.row();

			keyboard.text("➕ Добавить показания", `create-reading-${accountId}`).row();
			keyboard.text("⬅️ Назад", `account-${accountId}`);

			const account = await Account.findById(accountId);
			if (!account) {
				throw new Error(`Счёт с id ${accountId} не найден`);
			}
			const title = `📊 Показания за ${selectedYear} год (${Resource[account.resource].emoji ?? ""
				} №${account.account_number})${consumptionText}`;

			if (ctx.callbackQuery) {
				await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
			} else {
				await ctx.reply(title, { reply_markup: keyboard });
			}
		},
	};
}

export function makeReadingMenu(readingId: string, accountId: string): Menu {
	return {
		id: `reading-${readingId}`,
		title: "📊 Показание",
		inline: true,
		buttons: [
			{
				text: "🗑️ Удалить показание",
				callback: `delete-reading-${readingId}`,
				action: async (ctx) => {
					await UtilitiesReading.findByIdAndDelete(readingId);
					await ctx.reply("✅ Показание удалено");
					await ctx.services.menuHandler.showMenu(ctx, `readings-${accountId}`);
				},
			},
			{
				text: "⬅️ Назад",
				callback: `readings-${accountId}`,
				nextMenu: `readings-${accountId}`,
			},
		],
		action: async (ctx) => {
			const reading = await UtilitiesReading.findById(readingId);

			if (!reading) {
				await ctx.reply("❌ Показание не найдено");
				return;
			}

			// формируем строку из зон
			const zonesStr = reading.zones.map((z) => `${z.name}: ${z.value}`).join("\n");

			const keyboard = new InlineKeyboard()
				.text("🗑️ Удалить показание", `delete-reading-${readingId}`).danger()
				.row()
				.text("⬅️ Назад", `readings-${accountId}`);

			const title = `📊 Показание за ${reading.month}.${reading.year}:\n${zonesStr}`;

			if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
			else await ctx.reply(title, { reply_markup: keyboard });
		},
	};
}

export function makeTariffsMenu(accountId: string): Menu {
	return {
		id: `tariffs-${accountId}`,
		title: "💰 Тарифы",
		inline: true,
		buttons: [
			{
				text: "➕ Добавить тариф",
				callback: `create-tariff-${accountId}`,
				action: async (ctx) => {
					ctx.wizard.state.accountId = accountId;
					await ctx.services.sceneManager.enter(ctx, "create-tariff");
				},
			},
			{
				text: "⬅️ Назад",
				callback: `account-${accountId}`,
				nextMenu: `account-${accountId}`,
			},
		],
		action: async (ctx) => {
			const tariffs = await Tariff.find({ account_id: accountId }).sort({
				startDate: -1,
			});
			const keyboard = new InlineKeyboard();

			if (tariffs.length > 0) {
				tariffs.forEach((t) => {
					ctx.services.menuHandler.registerMenu(
						`tariff-${t._id.toString()}`,
						makeTariffMenu(t._id.toString(), accountId),
					);

					const month = t.startDate.getMonth() + 1;
					const year = t.startDate.getFullYear();

					const zonesStr = t.zones.map((z) => `${z.name}: ${z.price}₴`).join(", ");
					keyboard.text(`${month.toString().padStart(2, "0")}.${year}: ${zonesStr}`, `tariff-${t._id}`).row();
				});
			}

			keyboard.text("➕ Добавить тариф", `create-tariff-${accountId}`).row();
			keyboard.text("⬅️ Назад", `account-${accountId}`);

			if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText("💰 Тарифы:", { reply_markup: keyboard });
			else await ctx.reply("💰 Тарифы:", { reply_markup: keyboard });
		},
	};
}

export function makeTariffMenu(tariffId: string, accountId: string): Menu {
	return {
		id: `tariff-${tariffId}`,
		title: "💰 Тариф",
		inline: true,
		buttons: [
			{
				text: "🗑️ Удалить тариф",
				callback: `delete-tariff-${tariffId}`,
				action: async (ctx) => {
					await Tariff.findByIdAndDelete(tariffId);
					await ctx.reply("✅ Тариф удалён");
					await ctx.services.menuHandler.showMenu(ctx, `tariffs-${accountId}`);
				},
			},
			{
				text: "⬅️ Назад",
				callback: `tariffs-${accountId}`,
				nextMenu: `tariffs-${accountId}`,
			},
		],
		action: async (ctx) => {
			const tariff = await Tariff.findById(tariffId);
			if (!tariff) {
				await ctx.reply("❌ Тариф не найден");
				return;
			}

			const zonesStr = tariff.zones.map((z) => `${z.name}: ${z.price.toLocaleString('ru-RU', { style: 'currency', currency: 'UAH', currencyDisplay: 'symbol' })}`).join("\n");

			const keyboard = new InlineKeyboard()
				.text("🗑️ Удалить тариф", `delete-tariff-${tariffId}`).danger()
				.row()
				.text("⬅️ Назад", `tariffs-${accountId}`);



			const title = `💰 Тариф (${tariff.type})\n${zonesStr}\nНачало действия: ${tariff.startDate.toLocaleDateString('ru-RU')}`;

			if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
			else await ctx.reply(title, { reply_markup: keyboard });
		},
	};
}