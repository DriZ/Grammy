/**
 * whoami.ts - Команда для показа информации о пользователе
 *
 * Пример команды с проверкой прав (permission: 1 = только админ)
 */

import Command from "../../structures/Command.js";
import { PermissionLevel, type BaseContext } from "../../types/index.js";
import type BotClient from "../../core/Client.js";

/**
 * Команда whoami - показывает информацию о текущем пользователе
 */
export default class WhoamiCommand extends Command {
  /**
   * Конструктор
   * permission: 1 = требуется роль админа
   */
  constructor(client: BotClient) {
    super(client, {
      description: "Показать информацию о себе",
      permission: PermissionLevel.Admin,
    });
  }

  /**
   * Выполнить команду
   *
   * TypeScript особенности здесь:
   * 1. ctx.from - может быть undefined, поэтому проверяем
   * 2. Optional chaining (?.) - безопасно обращаемся к свойствам
   * 3. Template literals (обратные кавычки) - удобные строки с переменными
   */
  async execute(ctx: BaseContext): Promise<void> {
    // Получаем пользователя, но это может быть undefined
    // Non-null assertion (!) говорит TypeScript, что мы уверены в значении
    const user = ctx.from!;

    // Строим информацию о пользователе
    const info = `
👤 **Твоя информация:**
├ ID: \`${user.id}\`
├ Имя: ${user.first_name}
${user.last_name ? `├ Фамилия: ${user.last_name}` : ""}
├ Username: ${user.username ? `@${user.username}` : "Не установлено"}
└ Статус: ✅ Администратор
    `.trim();

    // Отправляем с Markdown разметкой
    await ctx.reply(info, { parse_mode: "Markdown" });
  }
}
