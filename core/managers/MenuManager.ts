import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { CallbackContext, IMenu, IMenuButton } from "../../types/index.js";
import type BotClient from "../Client.js";
import config from "../../config.js";
import { EPermissionLevel, type TPermissionLevel } from "../../types/index.js";
import { InlineKeyboard } from "grammy";
import { BaseMenu } from "../structures/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Менеджер меню
 * Хранит, загружает, управляет доступом и предоставляет данные для меню.
 */
export class MenuManager {
	private client: BotClient;
	public menus: Map<string, IMenu>;
	public dynamicMenuResolver: ((ctx: CallbackContext, menuId: string) => Promise<IMenu | null>) | null = null;

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
		const Exported = module.default;

		// Пропускаем файлы без default export (например, утилиты или фабрики меню)
		if (!Exported) return;

		let menu: IMenu;
		if (Exported.prototype instanceof BaseMenu) {
			menu = new Exported(this.client);
		} else {
			menu = Exported;
		}

		if (!menu.id) {
			throw new Error(`❌ Меню в файле ${menuPath} не имеет id`);
		}

		this.menus.set(menu.id, menu);
		console.log(`✅ Меню загружено: ${menu.id}`);
	}

	async loadMenus(menusDir: string = path.join(__dirname, "..", "..", "menus")): Promise<Map<string, IMenu>> {
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

	registerMenu(id: string, menu: IMenu) {
		console.log(`Регистрирую меню ${menu.title} - ${id}`);
		return this.menus.set(id, menu);
	}

	/**
	 * Удаляет меню и корректирует навигацию, чтобы исключить удаленный элемент из истории.
	 * @param ctx Контекст
	 * @param deletedMenuId ID удаляемого меню (которое нужно стереть из памяти и истории)
	 * @param parentMenuId ID родительского меню (куда пользователь должен попасть)
	 */
	cleanupForDeletion(ctx: CallbackContext, deletedMenuId: string, parentMenuId: string) {
		// 1. Удаляем само меню из реестра
		this.menus.delete(deletedMenuId);

		// 2. Подменяем текущее меню на родительское, чтобы удаленное не попало в историю при переходе
		ctx.session.currentMenuId = parentMenuId;

		// 3. Если родительское меню уже есть на вершине стека — убираем его, чтобы не было дубля
		const stack = ctx.session.menuStack;
		if (stack.length > 0 && stack[stack.length - 1] === parentMenuId) {
			stack.pop();
		}
	}

	getAvailableCommandButtons(ctx: CallbackContext): IMenuButton[] {
		const userId = ctx.from?.id;
		const isOwner = config.owner && userId === config.owner;
		const isAdmin = config.admins && config.admins.includes(userId || 0);

		let userPerm: TPermissionLevel = EPermissionLevel.User;
		if (isAdmin) userPerm = EPermissionLevel.Admin;
		if (isOwner) userPerm = EPermissionLevel.Owner;

		const buttons: IMenuButton[] = [];

		this.client.commandManager.commands.forEach((cmd) => {
			if (cmd.config.permission > userPerm) return;
			if (!cmd.config.enabled) return;
			if (cmd.config.showInMenu === false) return;

			buttons.push({
				text: `🔹 ${cmd.info.description || cmd.info.name}`,
				callback: `cmd:${cmd.info.name}`,
			} as IMenuButton);
		});

		return buttons;
	}

	/**
	 * Вернуться назад по истории меню
	 */
	async goBack(ctx: CallbackContext): Promise<void> {
		const prevMenuId = ctx.session.menuStack.pop();
		if (!prevMenuId) {
			return this.showMenu(ctx, "utilities-menu");
		}
		return this.showMenu(ctx, prevMenuId, true);
	}

	/**
	 * Показать меню пользователю
	 * @param ctx - контекст Telegraf
	 * @param id - id меню
	 * @param isBack - флаг, указывающий, что это переход назад (не нужно пушить в историю)
	 */
	async showMenu(ctx: CallbackContext, nextMenu: string | IMenu | null = null, isBack: boolean = false): Promise<void> {
		let menuId: string;
		let menuObj: IMenu | undefined;

		if (nextMenu && typeof nextMenu === 'object') {
			menuObj = nextMenu;
			menuId = menuObj.id;
		} else {
			menuId = (nextMenu as string) || ctx.callbackQuery?.data || "";
		}

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
				keyboard.row().text(ctx.t("button.back"), "menu-back");
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

		// 1. Ищем в статических/зарегистрированных меню
		// 2. Если передан объект, используем его
		// 3. Если нет, пробуем разрешить динамически через Resolver
		const menu = this.menus.get(menuId) || menuObj || (this.dynamicMenuResolver ? await this.dynamicMenuResolver(ctx, menuId) : null);

		if (!menu) {
			await ctx.reply("❌ Меню не найдено.");
			return;
		}
		console.log(`Загружается меню ${typeof menu.title === "function" ? menu.title(ctx) : menu.title} - ${menu.id}`);

		if (menu.execute) {
			return menu.execute(ctx);
		}

		// Создаём клавиатуру из кнопок меню
		const keyboard = new InlineKeyboard();
		menu.buttons.forEach((b) => {
			const buttonText = ctx.resolveText(b.text);
			keyboard.text(buttonText, b.callback || b.nextMenu || "noop").row();
		});

		// Автоматически добавляем кнопку "Назад", если есть куда возвращаться
		if (ctx.session.menuStack.length > 0) {
			keyboard.row().text(ctx.t("button.back"), "menu-back");
		}

		const menuTitle = ctx.resolveText(menu.title);
		ctx.callbackQuery
			? await ctx.callbackQuery.message?.editText(menuTitle, { reply_markup: keyboard })
			: await ctx.reply(menuTitle, { reply_markup: keyboard });
		return;
	}
}
