import type { CallbackContext, IMenuButton, IMenu } from "../../types/index.js";
import type BotClient from "../Client.js";

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
  get title(): string | ((ctx: CallbackContext) => Promise<string>) {
    return "Menu";
  }

  /**
   * Кнопки меню.
   * Для статических меню переопределяем этот геттер.
   * Для динамических - возвращаем асинхронную функцию.
   */
  get buttons(): IMenuButton[] | ((ctx: CallbackContext) => Promise<IMenuButton[]>) {
    return [];
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
