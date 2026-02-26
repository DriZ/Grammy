import type BotClient from "@core/Client.js";
import type { CallbackContext, TStepHandler } from "@app-types/index.js";

/**
* Базовый класс для сцен
*/
export abstract class BaseScene {
	protected client: BotClient;
	public name: string;

	constructor(client: BotClient, name: string) {
		this.client = client;
		this.name = name;
	}

	// Геттер должен возвращать массив функций-шагов
	abstract get steps(): TStepHandler[];

	/**
	 * Завершает сцену и возвращает пользователя в меню
	 * @param ctx Контекст
	 * @param text Текст сообщения
	 * @param menu Имя меню для возврата (по умолчанию utilities-menu)
	 * @returns 
	 */
	protected async abort(ctx: CallbackContext, text: string = "❌ Действие отменено.", menu: string = "utilities-menu"): Promise<void> {
		await ctx.scene.backToMenu(ctx, text, menu);
		return ctx.scene.leave();
	}

	/**
	 * Проверяет, была ли нажата кнопка отмены.
	 * Если да — завершает сцену.
	 * @param ctx Контекст
	 * @param text Текст сообщения
	 * @param menu Имя меню для возврата (по умолчанию utilities-menu)
	 * @returns true, если сцена была отменена (нужно прервать выполнение шага)
	 */
	protected async checkCancel(ctx: CallbackContext, text?: string, menu?: string): Promise<boolean> {
		if (ctx.callbackQuery?.data === "cancel" || ctx.update.callback_query?.data === "cancel") {
			await this.abort(ctx, text, menu);
			return true;
		}
		return false;
	}

	/**
	 * Обрабатывает ошибку: логирует её и выводит сообщение пользователю.
	 * Возвращает пользователя в меню и завершает сцену.
	 * @param ctx Контекст
	 * @param error Содержимое ошибки для отображения в консоли
	 * @param text Текст, выводимый пользователю
	 * @param menu Имя меню для возврата (по умолчанию utilities-menu)
	 */
	protected async handleError(ctx: CallbackContext, error: unknown, text: string = "❌ Произошла ошибка.", menu: string = "utilities-menu"): Promise<void> {
		console.error(`[Scene: ${this.name}] Error:`, error);
		await ctx.scene.backToMenu(ctx, text, menu);
		return ctx.scene.leave();
	}
}
