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
import { InlineKeyboard } from "grammy";

export function makeYearMonthKeyboard(selectedYear: number): InlineKeyboard {
	const keyboard = new InlineKeyboard();
	const currentMonth = new Date().getMonth() + 1;
	const currentYear = new Date().getFullYear();

	// месяцы
	for (let m = 1; m <= 12; m++) {
		if (m === currentMonth && selectedYear === currentYear) keyboard.text(`${m}`, `select-month-${selectedYear}-${m}`).primary();
		else keyboard.text(`${m}`, `select-month-${selectedYear}-${m}`);
		if (m % 3 === 0) keyboard.row();
	}
	// годы: выбранный год всегда в центре
	const years = [selectedYear - 1, selectedYear, selectedYear + 1];
	years.forEach((y) => {
		if (y === selectedYear) {
			keyboard.text(`${y}`, `select-year-${y}`).primary();
		} else if (y < selectedYear) {
			keyboard.text(`⬅️ ${y}`, `select-year-${y}`);
		} else {
			keyboard.text(`${y} ➡️`, `select-year-${y}`);
		}
	});
	return keyboard;
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
export async function getItemId(accessToken: string, shareLink: string): Promise<string> {
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
		throw new Error(`Ошибка при чтении Excel: ${response.status} ${response.statusText}`);
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
 * Склоняет слово в зависимости от числа (русский язык).
 * @param count - Число для склонения.
 * @param singular - Форма для 1 (например, "яблоко").
 * @param pluralFew - Форма для 2-4 (например, "яблока").
 * @param pluralMany - Форма для 5+ (например, "яблок").
 * @returns {string} Правильная форма слова.
 *
 * @example
 * pluralize(1, 'яблоко', 'яблока', 'яблок'); // 'яблоко'
 * pluralize(3, 'яблоко', 'яблока', 'яблок'); // 'яблока'
 * pluralize(5, 'яблоко', 'яблока', 'яблок'); // 'яблок'
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
