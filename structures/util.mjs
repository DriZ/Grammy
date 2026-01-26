import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
	auth: {
		clientId: process.env.AZURE_CLIENT_ID,
		authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
		clientSecret: process.env.AZURE_CLIENT_SECRET,
	},
};

const cca = new ConfidentialClientApplication(msalConfig);


export default class Util {
	/**
	 * Получает токен доступа для Microsoft Graph API
	 * @returns {Promise<string>} Токен доступа
	 */
	static async getToken() {
		try {
			const response = await cca.acquireTokenByClientCredential({
				scopes: ["https://graph.microsoft.com/.default"],
			});
			return response.accessToken;
		} catch (error) {
			console.error("Ошибка при получении токена доступа:", error);
			throw error;
		}
	}

	/**
	 * Получает ID элемента OneDrive по ссылке для общего доступа
	 * @param {string} accessToken - Токен доступа Microsoft Graph API
	 * @param {string} shareLink - Ссылка для общего доступа
	 * @returns {Promise<string>} ID элемента OneDrive
	 */
	static async getItemId(accessToken, shareLink) {
		const encodedLink = encodeURIComponent(shareLink);
		const url = `https://graph.microsoft.com/v1.0/shares/u!${encodedLink}/driveItem`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Ошибка при получении ID элемента: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.id;
	}

	static async readExcel(accessToken, itemId, sheetName) {
		const url = `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/workbook/worksheets('${sheetName}')/usedRange`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
			},
		});
		
		if (!response.ok) {
			throw new Error(`Ошибка при чтении Excel: ${response.status} ${response.statusText}`);
		}
		const data = await response.json();
		return data.values;
	}

	/**
	 * Преобразует строку в формат команды (нижний регистр, без пробелов)	
	 * @param {string} str - Строка для преобразования
	 * @returns {string} Преобразованная строка
	 */
	static toCommandFormat(str) {
		return str.toLowerCase().replace(/\s+/g, '');
	}

	/**
	 * Задержка выполнения на указанное количество миллисекунд
	 * @param {number} ms - Количество миллисекунд для задержки
	 * @returns {Promise<void>} Промис, который разрешается после задержки
	 */
	static async sleep(ms) {
		return await new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Генерирует случайное целое число в заданном диапазоне
	 * @param {number} min - Минимальное значение (включительно)
	 * @param {number} max - Максимальное значение (исключительно)
	 * @returns {number} Случайное целое число
	 */
	static getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
	}

	/**
	 * Форматирует дату в строку вида "DD.MM.YYYY HH:MM:SS"
	 * @param {Date} date - Дата для форматирования
	 * @returns {string} Отформатированная дата
	 */
	static formatDate(date) {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
	}

	/**
	 * Экранирует специальные символы MarkdownV2 в тексте
	 * @param {string} text - Входной текст
	 * @returns {string} Текст с экранированными символами
	 */
	static escapeMarkdownV2(text) {
		return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
	}

	/**
	 * Разбивает массив на чанки заданного размера
	 * @param {Array} array - Исходный массив
	 * @param {number} chunkSize - Размер чанка
	 * @returns {Array<Array>} Массив чанков
	 */
	static chunkArray(array, chunkSize) {
		const chunks = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
	}

	/**
	 * Делает первую букву строки заглавной
	 * @param {string} string - Входная строка
	 * @returns {string} Строка с заглавной первой буквой
	 */
	static capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	/**
	 * Преобразует значение в булево
	 * @param {string|number|boolean} value - Входящее значение
	 * @returns {boolean|null} Булево значение или null, если не удалось распознать
	 */
	static parseBoolean(value) {
		if (typeof value === 'string') {
			const val = value.toLowerCase();
			if (val === 'true' || val === '1' || val === 'yes') return true;
			if (val === 'false' || val === '0' || val === 'no') return false;
		} else if (typeof value === 'number') {
			return value === 1;
		} else if (typeof value === 'boolean') {
			return value;
		}
		return null; // Не удалось распознать
	}

	/**
	 * Обрезает текст до указанной длины, добавляя "..." в конце, если текст был обрезан
	 * @param {string} text - Входной текст
	 * @param {number} maxLength - Максимальная длина текста
	 * @returns {string} Обрезанный текст
	 */
	static truncateText(text, maxLength) {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength - 3) + '...';
	}

	/**
	 * Проверяет, является ли строка валидным URL
	 * @param {string} string - Входная строка
	 * @returns {boolean} true, если строка является валидным URL, иначе false
	 */
	static isValidUrl(string) {
		try {
			new URL(string);
			return true;
		} catch (_) {
			return false;  
		}
	}

	/**
	 * Склоняет слово в зависимости от числа (русский язык)
	 * @param {number} count - Число для склонения
	 * @param {string} singular - Форма для 1 (например, "яблоко")
	 * @param {string} pluralFew - Форма для 2-4 (например, "яблока")
	 * @param {string} pluralMany - Форма для 5 и более (например, "яблок")
	 * @returns {string} Правильная форма слова
	 */
	static pluralize(count, singular, pluralFew, pluralMany) {
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
}