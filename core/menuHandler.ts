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
import config from "../config.js";
import { PermissionLevel } from "../types/index.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * Обработчик меню
 */
export default class MenuHandler {
	private client: BotClient;
	public menus: Map<string, Menu>;

	/**
	 * Конструктор
	 * @param client - экземпляр BotClient
	 * @param sceneHandler - обработчик сцен для вызова сцен из меню
	 */
	constructor(client: BotClient) {
		this.client = client;
		this.menus = new Map();

		// Слушаем кнопку "🤖 Команды" из Reply-меню
		this.client.hears("🤖 Команды", async (ctx) => {
			await this.showMenu(ctx as any, "commands-list");
		});

		// Регистрируем глобальный обработчик для динамических кнопок команд
		this.client.callbackQuery(/^cmd:(.+)$/, async (ctx) => {
			const match = ctx.match as RegExpMatchArray;
			console.log(`Словил кнопку команды: ${match[1]}`)
			const commandName = match[1];
			const command = this.client.commandManager.commands.get(commandName);

			if (command) {
				await ctx.answerCallbackQuery();

				// Переопределяем reply для редактирования сообщения и добавления кнопки Назад
				const originalReply = ctx.reply.bind(ctx);
				(ctx as any).reply = async (text: string, extra: any = {}) => {
					const backBtn = { text: "🔙 Назад", callback_data: "commands-list" };

					if (!extra.reply_markup) {
						extra.reply_markup = new InlineKeyboard().row(backBtn);
					} else if (extra.reply_markup instanceof InlineKeyboard) {
						extra.reply_markup.row().text(backBtn.text, backBtn.callback_data);
					} else if (extra.reply_markup.inline_keyboard) {
						extra.reply_markup.inline_keyboard.push([backBtn]);
					}

					try {
						return await ctx.editMessageText(text, extra);
					} catch (e) {
						// Если редактирование невозможно (например, контент не изменился), отправляем новое
						return await originalReply(text, extra);
					}
				};

				// Выполняем команду. Передаем пустые аргументы.
				try {
					await command.execute(ctx as any, []);
				} catch (e) {
					console.error(`Ошибка выполнения команды ${commandName} из меню:`, e);
					await originalReply("❌ Ошибка при выполнении команды.");
				}
			} else {
				await ctx.answerCallbackQuery("⚠️ Команда не найдена или отключена.");
			}
		});

		// Регистрируем глобальный обработчик для навигации по меню
		this.client.on("callback_query:data", async (ctx, next) => {
			const menuId = ctx.callbackQuery.data;

			if (menuId === "commands-list" || menuId === "delete-msg") {
				await ctx.answerCallbackQuery();
				return this.showMenu(ctx as CallbackContext, menuId);
			}

			// if (this.menus.has(menuId)) {
			// 	await ctx.answerCallbackQuery();
			// 	return this.showMenu(ctx as CallbackContext, menuId);
			// }
			return next();
		});
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
		const menuId = nextMenu || ctx.callbackQuery?.data || "";

		if (menuId === "delete-msg") {
			await ctx.msg?.delete().catch(() => { });
			return;
		}

		if (menuId === "commands-list") {
			const buttons = this.getAvailableCommandButtons(ctx);
			const keyboard = new InlineKeyboard();

			// Группируем по 2 кнопки в ряд
			for (let i = 0; i < buttons.length; i += 2) {
				const b1 = buttons[i];
				const b2 = buttons[i + 1];
				keyboard.text(b1.text, b1.callback);
				if (b2) keyboard.text(b2.text, b2.callback);
				keyboard.row();
			}
			keyboard.text("❌ Закрыть", "delete-msg");

			const text = "🤖 **Выберите команду:**";
			if (ctx.callbackQuery) {
				await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: "Markdown" });
			} else {
				await ctx.reply(text, { reply_markup: keyboard, parse_mode: "Markdown" });
			}
			return;
		}

		const menu = this.menus.get(menuId);
		if (!menu) {
			await ctx.reply("❌ Меню не найдено.");
			return
		}
		console.log(`Загружается меню ${menu.title} - ${menu.id}`)

		if (menu.action) { return menu.action(ctx); }

		// Создаём клавиатуру из кнопок меню
		const keyboard = new InlineKeyboard()
		menu.buttons.map((b) => {
			keyboard.text(b.text, b.callback || b.nextMenu || "noop").row()
		});
		ctx.callbackQuery
			? await ctx.callbackQuery.message?.editText(menu.title, { reply_markup: keyboard })
			: await ctx.reply(menu.title, { reply_markup: keyboard });
		return
	}

	registerMenu(id: string, menu: Menu) {
		console.log(`Регистрирую меню ${menu.title} - ${menu.id}`)
		return this.menus.set(id, menu);
	}

	/**
	 * Получить список кнопок для доступных команд
	 */
	private getAvailableCommandButtons(ctx: CallbackContext): MenuButton[] {
		const userId = ctx.from?.id;
		const isOwner = config.owner && userId === config.owner;
		const isAdmin = config.admins && config.admins.includes(userId || 0);

		let userPerm = PermissionLevel.User;
		if (isAdmin) userPerm = PermissionLevel.Admin;
		if (isOwner) userPerm = PermissionLevel.Owner;

		const buttons: MenuButton[] = [];

		this.client.commandManager.commands.forEach((cmd) => {
			// Фильтруем по правам
			if (cmd.config.permission > userPerm) return;
			// Фильтруем отключенные
			if (!cmd.config.enabled) return;
			// Фильтруем скрытые из меню
			if (cmd.config.showInMenu === false) return;
			// Можно добавить фильтр по категории, если нужно
			// if (cmd.info.category !== 'Utilities') return;

			buttons.push({
				text: `🔹 ${cmd.info.description || cmd.info.name}`, // Используем описание или имя
				callback: `cmd:${cmd.info.name}`,
				// nextMenu и action здесь не нужны, так как мы используем callback
			} as MenuButton);
		});

		return buttons;
	}
}
