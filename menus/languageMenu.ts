import { BaseMenu } from "../core/structures/index.js";
import type { CallbackContext, IMenuButton } from "../types/index.js";
import { User } from "../models/index.js";
import type BotClient from "../core/Client.js";

export default class LanguageMenu extends BaseMenu {
  constructor(client: BotClient) {
    super(client, "language-menu");
  }

  get title() {
    return async (ctx: CallbackContext) => ctx.t("language-select-title");
  }

  get buttons(): IMenuButton[] {
    return [
      {
        text: "🇺🇦 Українська",
        callback: "lang-ua",
        action: async (ctx) => this.setLanguage(ctx, "ua"),
        row: true,
      },
      {
        text: "🇬🇧 English",
        callback: "lang-en",
        action: async (ctx) => this.setLanguage(ctx, "en"),
        row: true,
      },
      {
        text: "🇷🇺 Русский",
        callback: "lang-ru",
        action: async (ctx) => this.setLanguage(ctx, "ru"),
        row: true,
      }
    ];
  }

  private async setLanguage(ctx: CallbackContext, lang: string) {
    ctx.session.language = lang;
    await ctx.i18n.setLocale(lang);
    if (ctx.from?.id) {
      await User.findOneAndUpdate(
        { telegram_id: ctx.from.id },
        { language: lang },
        { upsert: true, new: true },
      );
    }
    await ctx.answerCallbackQuery(ctx.t("language-selected"));
    // Обновляем меню, чтобы заголовок отобразился на новом языке
    await ctx.services.menuManager.showMenu(ctx, this.id);
  }
}
