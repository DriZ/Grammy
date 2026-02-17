/**
 * Event.ts - Базовый класс для событий
 */

import { CallbackContext } from "../types/index.js";
import BotClient from "../core/Client.js";
import { FilterQuery } from "grammy";

/**
 * Абстрактный класс для всех событий
 */
export default abstract class Event {
  protected client: BotClient;
  public name: FilterQuery;
  public once: boolean;
  public info: {
    name: string;
  };

  /**
   * Конструктор события
   * @param client - экземпляр BotClient
   * @param name - имя события
   * @param once - одноразовое ли событие
   */
  constructor(
    client: BotClient,
    name: FilterQuery,
    once: boolean = false,
  ) {
    this.client = client;
    this.name = name;
    this.once = once;
    this.info = { name };
  }

  /**
   * Абстрактный метод execute - должен быть переопределён
   * @param ctx - контекст Telegraf
   */
  abstract execute(ctx: CallbackContext): Promise<void>;
}
