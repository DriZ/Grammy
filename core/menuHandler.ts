/**
 * menuHandler.ts - Обработчик меню/кнопок
 *
 * Управляет загрузкой и отображением интерактивных меню
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { CallbackContext, Menu, MenuButton } from "../types/index.js";
import BotClient from "./Client.js";
import { InlineKeyboard } from "grammy";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * Обработчик меню
 */
export default class MenuHandler {
	private client: BotClient;
	private menus: Map<string, Menu>;

	/**
	 * Конструктор
	 * @param client - экземпляр BotClient
	 * @param sceneHandler - обработчик сцен для вызова сцен из меню
	 */
	constructor(client: BotClient) {
		this.client = client;
		this.menus = new Map();
	}

	/**
	 * Проверить, существует ли файл меню
	 * @param menuPath - путь к файлу меню
	 * @returns true если файл существует
	 */
	private _ifPath(menuPath: string): boolean {
		return fs.existsSync(menuPath);
	}

	/**
	 * Загрузить одно меню
	 * @param menuPath - путь к файлу меню
	 */
	async loadMenu(menuPath: string): Promise<void> {
		if (!this._ifPath(menuPath)) {
			throw new Error(`⚠️ Файл меню не найден: ${menuPath}`);
		}

		const module = await import(`file://${menuPath}`);
		const menu: Menu = module.default;

		if (!menu || !menu.id) {
			throw new Error(`❌ Меню в файле ${menuPath} не имеет id`);
		}

		// Регистрируем обработчики кнопок
		this.menus.set(menu.id, menu);

		if (menu.buttons && Array.isArray(menu.buttons)) {
			// Внутри loadMenu, после client.hears(...)
			menu.buttons.forEach((btn: MenuButton) => {
				if (menu.inline) {
					// Inline кнопки
					this.client.callbackQuery(btn.callback, async (ctx) => {
						try {
							await ctx.answerCallbackQuery();
							console.log(`🔘 Нажата кнопка: "${btn.text}"`);
							// 1. Если callback совпадает с именем сцены — запускаем сцену 
							const scene = this.client.sceneManager.getScene(btn.callback);
							if (scene) {
								return this.client.sceneManager.enter(ctx, btn.callback);
							}
							// 2. Если указан nextMenu — показываем меню 
							if (btn.nextMenu) {
								return this.showMenu(ctx, btn.nextMenu);
							}
							// 3. Если есть кастомное действие — выполняем его 
							if (btn.action) {
								return btn.action(ctx);
							}
						} catch (error) {
							console.error(`❌ Ошибка при обработке кнопки "${btn.text}":`, error);
						}
					});
				} else {
					// Reply кнопки
					this.client.hears(btn.text, async (ctx) => {
						try {
							console.log(`🔘 Reply кнопка нажата: "${btn.text}"`);
							if (ctx.message) await ctx.msg.delete()
							if (btn.nextMenu) {
								return this.showMenu(ctx as any, btn.nextMenu);
							}
							if (btn.action) btn.action(ctx as any);
							return
						} catch (error) {
							console.error(`❌ Ошибка при обработке reply кнопки "${btn.text}":`, error);
						}
					});
				}
			});
		}

		console.log(`✅ Меню загружено: ${menu.id}`);
	}

	/**
	 * Загрузить все меню из директории
	 * @param menusDir - директория с меню
	 * @returns Map со всеми меню
	 */
	async loadMenus(
		menusDir: string = path.join(__dirname, "..", "menus"),
	): Promise<Map<string, Menu>> {
		const files = fs.readdirSync(menusDir).filter((f) => f.endsWith(".js")); // .js - скомпилированные файлы

		for (const file of files) {
			const filePath = path.join(menusDir, file);
			try {
				await this.loadMenu(filePath);
			} catch (error) {
				console.error(`❌ Ошибка при загрузке меню из ${filePath}, пропускаю...`);
			}
		}

		console.log(`📦 Всего меню загружено: ${this.menus.size}`);
		return this.menus;
	}

	/**
	 * Показать меню пользователю
	 * @param ctx - контекст Telegraf
	 * @param id - id меню
	 */
	async showMenu(ctx: CallbackContext, nextMenu: string | null = null): Promise<void> {
		const menu = nextMenu ? this.getMenu(nextMenu) : this.getMenu(ctx.callbackQuery.data);
		if (!menu) {
			await ctx.reply("❌ Меню не найдено.");
			return
		}
		console.log(`Загружается меню ${menu.title} - ${menu.id}`)

		if (menu.action) { return menu.action(ctx); }

		// Создаём клавиатуру из кнопок меню
		const keyboard = new InlineKeyboard()
		menu.buttons.map((b) => keyboard.text(b.text, b.callback).row());
		ctx.callbackQuery
			? await ctx.callbackQuery.message?.editText(menu.title, { reply_markup: keyboard })
			: await ctx.reply(menu.title, { reply_markup: keyboard });
		return
	}

	/**
	 * Получить меню по id
	 * @param id - id меню
	 * @returns меню или null
	 */
	getMenu(id: string): Menu | null {
		return this.menus.get(id) || null;
	}

	/**
	 * Получить все меню
	 * @returns Map со всеми меню
	 */
	getAllMenus(): Map<string, Menu> {
		return this.menus;
	}

	registerMenu(id: string, menu: Menu) {
		console.log(`Регистрирую меню ${menu.title} - ${menu.id}`)
		return this.menus.set(id, menu);
	}
}
