import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { CallbackContext, Menu, MenuButton } from "../../types/index.js";
import BotClient from "../Client.js";
import config from "../../config.js";
import { PermissionLevel } from "../../types/index.js";
import { InlineKeyboard } from "grammy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Менеджер меню
 * Хранит, загружает, управляет доступом и предоставляет данные для меню.
 */
export default class MenuManager {
	private client: BotClient;
	public menus: Map<string, Menu>;

	constructor(client: BotClient) {
		this.client = client;
		this.menus = new Map();
	}

	private _ifPath(menuPath: string): boolean {
		return fs.existsSync(menuPath);
	}

	async loadMenu(menuPath: string): Promise<void> {
		if (!this._ifPath(menuPath)) {
			throw new Error(`⚠️ Файл меню не найден: ${menuPath}`);
		}

		const module = await import(`file://${menuPath}`);
		const menu: Menu = module.default;

		if (!menu || !menu.id) {
			throw new Error(`❌ Меню в файле ${menuPath} не имеет id`);
		}

		this.menus.set(menu.id, menu);
		console.log(`✅ Меню загружено: ${menu.id}`);
	}

	async loadMenus(menusDir: string = path.join(__dirname, "..", "..", "menus")): Promise<Map<string, Menu>> {
		const files = fs.readdirSync(menusDir).filter((f) => f.endsWith(".js"));

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

	registerMenu(id: string, menu: Menu) {
		console.log(`Регистрирую меню ${menu.title} - ${id}`);
		return this.menus.set(id, menu);
	}

	getAvailableCommandButtons(ctx: CallbackContext): MenuButton[] {
		const userId = ctx.from?.id;
		const isOwner = config.owner && userId === config.owner;
		const isAdmin = config.admins && config.admins.includes(userId || 0);

		let userPerm = PermissionLevel.User;
		if (isAdmin) userPerm = PermissionLevel.Admin;
		if (isOwner) userPerm = PermissionLevel.Owner;

		const buttons: MenuButton[] = [];

		this.client.commandManager.commands.forEach((cmd) => {
			if (cmd.config.permission > userPerm) return;
			if (!cmd.config.enabled) return;
			if (cmd.config.showInMenu === false) return;

			buttons.push({
				text: `🔹 ${cmd.info.description || cmd.info.name}`,
				callback: `cmd:${cmd.info.name}`,
			} as MenuButton);
		});

		return buttons;
	}

	/**
	 * Вернуться назад по истории меню
	 */
	async goBack(ctx: CallbackContext): Promise<void> {
		const prevMenuId = ctx.session.menuStack.pop();
		if (!prevMenuId) {
			return this.showMenu(ctx, "main-menu");
		}
		return this.showMenu(ctx, prevMenuId, true);
	}

	/**
	 * Показать меню пользователю
	 * @param ctx - контекст Telegraf
	 * @param id - id меню
	 * @param isBack - флаг, указывающий, что это переход назад (не нужно пушить в историю)
	 */
	async showMenu(ctx: CallbackContext, nextMenu: string | null = null, isBack: boolean = false): Promise<void> {
		const menuId = nextMenu || ctx.callbackQuery?.data || "";

		if (menuId === "delete-msg") {
			await ctx.msg?.delete().catch(() => { });
			return;
		}

		// --- ЛОГИКА ХЛЕБНЫХ КРОШЕК ---
		// Если переходим в главное меню — очищаем историю
		if (menuId === "main-menu") {
			ctx.session.menuStack = [];
		}
		// Если это обычный переход (не назад) и мы меняем меню — сохраняем текущее в историю
		else if (!isBack && ctx.session.currentMenuId && ctx.session.currentMenuId !== menuId) {
			// Не добавляем в стек, если мы просто обновляем то же самое меню
			ctx.session.menuStack.push(ctx.session.currentMenuId);
		}

		// Обновляем текущее меню
		ctx.session.currentMenuId = menuId;
		// -----------------------------

		if (menuId === "commands-list") {
			const buttons = this.getAvailableCommandButtons(ctx);
			const keyboard = new InlineKeyboard();

			// Группируем по 2 кнопки в ряд
			for (let i = 0; i < buttons.length; i += 2) {
				const b1 = buttons[i];
				const b2 = buttons[i + 1];
				keyboard.text(ctx.resolveText(b1.text), b1.callback);
				if (b2) keyboard.text(ctx.resolveText(b2.text), b2.callback);
				keyboard.row();
			}
			
			// Добавляем кнопку Назад, если есть история
			if (ctx.session.menuStack.length > 0) {
				keyboard.row().text(ctx.t("back-button"), "menu-back");
			} else {
				keyboard.row().text("❌ Закрыть", "delete-msg");
			}

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
			return;
		}
		console.log(`Загружается меню ${menu.title} - ${menu.id}`);

		if (menu.action) {
			return menu.action(ctx);
		}

		// Создаём клавиатуру из кнопок меню
		const keyboard = new InlineKeyboard();
		menu.buttons.forEach((b) => {
			const buttonText = ctx.resolveText(b.text);
			keyboard.text(buttonText, b.callback || b.nextMenu || "noop").row();
		});

		// Автоматически добавляем кнопку "Назад", если есть куда возвращаться
		if (ctx.session.menuStack.length > 0) {
			keyboard.row().text(ctx.t("back-button"), "menu-back");
		}

		const menuTitle = ctx.resolveText(menu.title);
		ctx.callbackQuery
			? await ctx.callbackQuery.message?.editText(menuTitle, { reply_markup: keyboard })
			: await ctx.reply(menuTitle, { reply_markup: keyboard });
		return;
	}
}
