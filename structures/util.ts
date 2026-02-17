/**
 * util.ts - Утилиты для работы с Excel, датами, строками и т.д.
 *
 * TypeScript концепции:
 * 1. Union types (|) - тип может быть одним из нескольких типов
 * 2. Nullable types (| null) - значение может быть null
 * 3. Generic функции с <T>
 * 4. Record<K, V> - типизированный объект
 */

import { ConfidentialClientApplication } from "@azure/msal-node";
import { CallbackContext, Menu } from "../types/index.js";
import { Account, Address, Tariff, UtilitiesReading } from "../models/index.js";
import { InlineKeyboard } from "grammy";


export function makeYearMonthKeyboard(selectedYear: number): InlineKeyboard {
	const keyboard = new InlineKeyboard();
	// месяцы 
	for (let m = 1; m <= 12; m++) {
		keyboard.text(`${m}`, `select-month-${selectedYear}-${m}`);
		if (m % 3 === 0) keyboard.row();
	}
	// годы: выбранный год всегда в центре 
	const years = [selectedYear - 1, selectedYear, selectedYear + 1];
	years.forEach((y) => {
		if (y === selectedYear) {
			keyboard.text(`${y}`, `select-year-${y}`).primary();
		} else {
			keyboard.text(`${y}`, `select-year-${y}`);
		}
	});
	return keyboard;
}

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
					ctx.wizard.params.addressId = addressId;
					await ctx.services.sceneManager.enter(ctx, "create-account");
				},
			},
			{
				text: "🗑️ Удалить адрес",
				callback: `delete-address-${addressId}`,
				action: async (ctx: CallbackContext) => {
					ctx.wizard.params.addreddId = addressId;
					await ctx.services.sceneManager.enter(ctx, "delete-address");
				}
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

			const keyboard = new InlineKeyboard();

			if (accounts.length > 0) {
				accounts.forEach((acc) => {
					const emoji =
						acc.resource === "electricity"
							? "⚡"
							: acc.resource === "water"
								? "💧"
								: acc.resource === "gas"
									? "🔥"
									: "";

					ctx.services.menuHandler.registerMenu(`account-${acc._id.toString()}`, makeAccountMenu(acc._id.toString(), addressId));
					keyboard.text(`${emoji} Счёт №${acc.account_number}`, `account-${acc._id}`).row();
				});
			}

			// стандартные кнопки
			keyboard.text("➕ Добавить счёт", `create-account-${addressId}`).row();
			if (accounts.length === 0) keyboard.text("🗑️ Удалить адрес", `delete-address-${addressId}`).row();
			keyboard.text("⬅️ Назад", "utilities-menu");

			if (ctx.callbackQuery) {
				await ctx.callbackQuery.message?.editText(`📋 Счета по адресу ${address?.name}:`, { reply_markup: keyboard });
			} else {
				await ctx.reply(`📋 Счета по адресу ${address?.name}:`, { reply_markup: keyboard });
			}
		},
	};
}

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
					ctx.wizard.params.accountId = accountId;
					await ctx.services.sceneManager.enter(ctx, "create-tariff");
				},
			}, {
				text: "📊 Показания",
				callback: `readings-${accountId}`,
				nextMenu: `readings-${accountId}`,
			}, {
				text: "🗑️ Удалить счёт",
				callback: `delete-account-${accountId}`,
				action: async (ctx) => {
					ctx.wizard.params.accountId = accountId;
					await ctx.services.sceneManager.enter(ctx, "delete-account");
				},
			}, {
				text: "⬅️ Назад",
				callback: `address-${addressId}`,
				nextMenu: `address-${addressId}`,
			},
		],
		action: async (ctx) => {
			const keyboard = new InlineKeyboard()
				.text("➕ Добавить тариф", `create-tariff-${accountId}`).row()
				.text("📊 Показания", `readings-${accountId}`).row()
				.text("🗑️ Удалить счёт", `delete-account-${accountId}`).row()
				.text("⬅️ Назад", `address-${addressId}`);

			const account = await Account.findById(accountId);
			ctx.services.menuHandler.registerMenu(`readings-${accountId}`, makeReadingsMenu(accountId));
			if (ctx.callbackQuery) {
				await ctx.callbackQuery.message?.editText(`⚡ Меню счёта ${account?.account_number}:`, {
					reply_markup: keyboard
				});
			} else {
				await ctx.reply(`⚡ Меню счёта ${account?.account_number}:`, { reply_markup: keyboard });
			}
		},
	};
}

export function makeReadingsMenu(accountId: string): Menu {
	return {
		id: `readings-${accountId}`,
		title: "📊 Показания",
		inline: true,
		buttons: [
			{
				text: "➕ Добавить показания",
				callback: `create-reading-${accountId}`,
				action: async (ctx) => {
					ctx.wizard.params.accountId = accountId;
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
			const readings = await UtilitiesReading.find({ account_id: accountId }).sort({ year: -1, month: -1 });
			const keyboard = new InlineKeyboard();

			if (readings.length > 0) {
				readings.forEach((r) => {
					ctx.services.menuHandler.registerMenu(
						`reading-${r._id.toString()}`,
						makeReadingMenu(r._id.toString(), accountId)
					);

					// формируем строку из зон
					const zonesStr = r.zones.map((z) => `${z.name}: ${z.value}`).join(", ");
					keyboard.text(`${r.month}.${r.year} → ${zonesStr}`, `reading-${r._id}`).row();
				});
			}

			keyboard.text("➕ Добавить показания", `create-reading-${accountId}`).row();
			keyboard.text("⬅️ Назад", `account-${accountId}`);

			const account = await Account.findById(accountId);
			const title = `📊 Показания по счёту №${account?.account_number}`;

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
				.text("🗑️ Удалить показание", `delete-reading-${readingId}`).row()
				.text("⬅️ Назад", `readings-${accountId}`);

			const text = `📊 Показание за ${reading.month}.${reading.year}:\n${zonesStr}`;

			if (ctx.callbackQuery) {
				await ctx.callbackQuery.message?.editText(text, { reply_markup: keyboard });
			} else {
				await ctx.reply(text, { reply_markup: keyboard });
			}
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
					ctx.wizard.params.accountId = accountId;
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
			const tariffs = await Tariff.find({ account_id: { accountId } }).sort({ startDate: -1 });
			const keyboard = new InlineKeyboard();

			if (tariffs.length > 0) {
				tariffs.forEach((t) => {
					ctx.services.menuHandler.registerMenu(
						`tariff-${t._id.toString()}`,
						makeTariffMenu(t._id.toString(), accountId)
					);

					const zonesStr = t.zones.map((z) => `${z.name}: ${z.price}₴`).join(", ");
					keyboard.text(`${t.type} → ${zonesStr}`, `tariff-${t._id}`).row();
				});
			}

			keyboard.text("➕ Добавить тариф", `create-tariff-${accountId}`).row();
			keyboard.text("⬅️ Назад", `account-${accountId}`);

			if (ctx.callbackQuery) {
				await ctx.callbackQuery.message?.editText("💰 Тарифы:", { reply_markup: keyboard });
			} else {
				await ctx.reply("💰 Тарифы:", { reply_markup: keyboard });
			}
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

			const zonesStr = tariff.zones.map((z) => `${z.name}: ${z.price}₴`).join("\n");

			const keyboard = new InlineKeyboard()
				.text("🗑️ Удалить тариф", `delete-tariff-${tariffId}`).row()
				.text("⬅️ Назад", `tariffs-${accountId}`);

			const text = `💰 Тариф (${tariff.type})\n${zonesStr}\nНачало действия: ${tariff.startDate.toLocaleDateString()}`;

			if (ctx.callbackQuery) {
				await ctx.callbackQuery.message?.editText(text, { reply_markup: keyboard });
			} else {
				await ctx.reply(text, { reply_markup: keyboard });
			}
		},
	};
}





// ======================
// AZURE / MICROSOFT GRAPH
// ======================

/**
 * Конфигурация Azure MSAL (Microsoft Authentication Library)
 */
const msalConfig = {
	auth: {
		clientId: process.env.AZURE_CLIENT_ID || "",
		authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
		clientSecret: process.env.AZURE_CLIENT_SECRET || "",
	},
};

const cca = new ConfidentialClientApplication(msalConfig);

/**
 * Получает токен доступа для Microsoft Graph API
 * @returns Токен доступа (строка)
 */
export async function getToken(): Promise<string> {
	try {
		const response = await cca.acquireTokenByClientCredential({
			scopes: ["https://graph.microsoft.com/.default"],
		});
		if (!response) {
			throw new Error("Failed to acquire token: response is null");
		}
		return response.accessToken;
	} catch (error) {
		console.error("Ошибка при получении токена доступа:", error);
		throw error;
	}
}

/**
 * Получает ID элемента OneDrive по ссылке для общего доступа
 * @param accessToken - Токен доступа Microsoft Graph API
 * @param shareLink - Ссылка для общего доступа
 * @returns ID элемента OneDrive
 */
export async function getItemId(
	accessToken: string,
	shareLink: string,
): Promise<string> {
	const encodedLink = encodeURIComponent(shareLink);
	const url = `https://graph.microsoft.com/v1.0/shares/u!${encodedLink}/driveItem`;

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response || !response.ok) {
		throw new Error(
			`Ошибка при получении ID элемента: ${response?.status} ${response?.statusText}`,
		);
	}

	// as - оператор типизации (тип assertion)
	const data = (await response.json()) as { id: string };
	return data.id;
}

/**
 * Читает данные из Excel файла через Microsoft Graph API
 * @param accessToken - Токен доступа
 * @param itemId - ID элемента на OneDrive
 * @param sheetName - Имя листа Excel
 * @returns Двумерный массив значений
 */
export async function readExcel(
	accessToken: string,
	itemId: string,
	sheetName: string,
): Promise<string[][]> {
	const url = `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/workbook/worksheets('${sheetName}')/usedRange`;

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(
			`Ошибка при чтении Excel: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as { values: string[][] };
	return data.values;
}

// ======================
// СТРОКОВЫЕ УТИЛИТЫ
// ======================

/**
 * Преобразует строку в формат команды (нижний регистр, без пробелов)
 * @param str - Строка для преобразования
 * @returns Преобразованная строка
 */
export function toCommandFormat(str: string): string {
	return str.toLowerCase().replace(/\s+/g, "");
}

/**
 * Экранирует специальные символы MarkdownV2 в тексте
 * @param text - Входной текст
 * @returns Текст с экранированными символами
 */
export function escapeMarkdownV2(text: string): string {
	return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

/**
 * Делает первую букву строки заглавной
 * @param string - Входная строка
 * @returns Строка с заглавной первой буквой
 */
export function capitalizeFirstLetter(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Обрезает текст до указанной длины, добавляя "..." в конце
 * @param text - Входной текст
 * @param maxLength - Максимальная длина
 * @returns Обрезанный текст
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + "...";
}

/**
 * Проверяет, является ли строка валидным URL
 * @param string - Входная строка
 * @returns true если валидный URL
 */
export function isValidUrl(string: string): boolean {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

// ======================
// ЧИСЛОВЫЕ УТИЛИТЫ
// ======================

/**
 * Генерирует случайное целое число в заданном диапазоне
 * @param min - Минимальное значение (включительно)
 * @param max - Максимальное значение (исключительно)
 * @returns Случайное целое число
 */
export function getRandomInt(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Преобразует значение в булево
 * @param value - Входящее значение (строка, число или булево)
 * @returns Булево значение или null если не удалось распознать
 */
export function parseBoolean(value: string | number | boolean): boolean | null {
	if (typeof value === "string") {
		const val = value.toLowerCase();
		if (val === "true" || val === "1" || val === "yes") return true;
		if (val === "false" || val === "0" || val === "no") return false;
	} else if (typeof value === "number") {
		return value === 1;
	} else if (typeof value === "boolean") {
		return value;
	}
	return null; // Не удалось распознать
}

/**
 * Склоняет слово в зависимости от числа (русский язык)
 * @param count - Число для склонения
 * @param singular - Форма для 1 (например, "яблоко")
 * @param pluralFew - Форма для 2-4 (например, "яблока")
 * @param pluralMany - Форма для 5+ (например, "яблок")
 * @returns Правильная форма слова
 */
export function pluralize(
	count: number,
	singular: string,
	pluralFew: string,
	pluralMany: string,
): string {
	const mod10 = count % 10;
	const mod100 = count % 100;

	if (mod10 === 1 && mod100 !== 11) {
		return singular;
	} else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
		return pluralFew;
	} else {
		return pluralMany;
	}
}

// ======================
// ВРЕМЕННЫЕ УТИЛИТЫ
// ======================

/**
 * Задержка выполнения на указанное количество миллисекунд
 * @param ms - Количество миллисекунд
 * @returns Promise который разрешается после задержки
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Форматирует дату в строку вида "DD.MM.YYYY HH:MM:SS"
 * @param date - Дата для форматирования (число или Date)
 * @returns Отформатированная дата
 */
export function formatDate(date: number | Date): string {
	const d = new Date(date);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0"); // Месяцы начинаются с 0
	const year = d.getFullYear();
	const hours = String(d.getHours()).padStart(2, "0");
	const minutes = String(d.getMinutes()).padStart(2, "0");
	const seconds = String(d.getSeconds()).padStart(2, "0");

	return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

// ======================
// МАССИВЫ / КОЛЛЕКЦИИ
// ======================

/**
 * Разбивает массив на чанки заданного размера
 * Generic <T> означает "любой тип"
 * @param array - Исходный массив
 * @param chunkSize - Размер чанка
 * @returns Массив чанков
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}
