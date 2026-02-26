// core/structures/Menu.ts
import type { CallbackContext, IMenuButton, IMenu } from "../../types/index.js";
import type BotClient from "../Client.js";
import { InlineKeyboard } from "grammy";

/**
 * Базовый класс для всех меню.
 * Реализует интерфейс IMenu для совместимости.
 */
export abstract class BaseMenu implements IMenu {
	protected client: BotClient;
	public id: string;
	public inline: boolean = true;

	constructor(client: BotClient, id: string) {
		this.client = client;
		this.id = id;
	}

	/**
	 * Заголовок меню.
	 * Можно переопределить как геттер или свойство.
	 */
	get title(): string | ((ctx: CallbackContext) => string) {
		return "Menu";
	}

	/**
	 * Кнопки меню.
	 * Для статических меню переопределяем этот геттер.
	 * Для динамических - строим кнопки внутри execute().
	 */
	get buttons(): IMenuButton[] {
		return [];
	}

	/**
	 * Основной метод выполнения меню.
	 * По умолчанию рендерит заголовок и кнопки из this.buttons.
	 * Для сложной логики (запросы в БД) переопределяем этот метод.
	 */
	async execute(ctx: CallbackContext): Promise<void> {
		const title = typeof this.title === "function" ? this.title(ctx) : this.title;
		const keyboard = new InlineKeyboard();

		this.buttons.forEach((b) => {
			const text = typeof b.text === "function" ? b.text(ctx) : b.text;
			keyboard.text(text, b.callback || b.nextMenu || "noop").row();
		});

		// Автоматически добавляем кнопку "Назад", если есть история
		if (ctx.session.menuStack.length > 0) {
			keyboard.row().text("⬅️ Назад", "menu-back");
		}

		if (ctx.callbackQuery) {
			await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
		} else {
			await ctx.reply(title, { reply_markup: keyboard });
		}
	}

	/**
	 * Регистрирует вложенное меню.
	 * Полезно для меню, которые не могут быть созданы автоматически через Resolver.
	 * @param ctx Контекст
	 * @param menu Экземпляр меню
	 */
	protected registerSubMenu(ctx: CallbackContext, menu: BaseMenu): void {
		// Регистрируем только если такого меню еще нет, чтобы не дублировать
		if (!ctx.services.menuManager.menus.has(menu.id)) {
			ctx.services.menuManager.registerMenu(menu.id, menu);
		}
	}
}
