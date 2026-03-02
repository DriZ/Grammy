import { BaseCommand } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { type BaseContext, EPermissionLevel } from "@app-types/index.js";
import { User } from "@models/index.js";
import { InlineKeyboard } from "grammy";

export default class BroadcastCommand extends BaseCommand {
  constructor(client: BotClient) {
    super(client, {
      name: "broadcast",
      description: "Рассылка сообщения всем пользователям",
      category: "Admin",
      usage: "/broadcast <текст> [--- кнопка | ссылка]",
      permission: EPermissionLevel.Admin,
      aliases: ["bc", "announce"],
    });
  }

  async execute(ctx: BaseContext): Promise<void> {
    const replyMessage = ctx.msg?.reply_to_message;

    // Получаем сырой текст сообщения, убирая саму команду
    const messageText = ctx.msg?.text || ctx.msg?.caption || "";
    // Регулярка убирает команду (/broadcast или /bc) из начала строки
    const rawArgs = messageText.replace(/^\/\S+\s*/, "").trim();

    // Разделяем текст и кнопки по разделителю "---"
    // Используем regex для поддержки переносов строк вокруг разделителя
    const parts = rawArgs.split(/\n*\s*-{3,}\s*\n*/);

    const contentText = parts[0].trim();
    const buttonsRaw = parts.length > 1 ? parts[1].trim() : "";

    // Парсим кнопки
    const keyboard = new InlineKeyboard();
    if (buttonsRaw) {
      const lines = buttonsRaw.split("\n");
      for (const line of lines) {
        const [label, url] = line.split("|").map(s => s.trim());
        if (label && url && url.startsWith("http")) {
          keyboard.url(label, url).row();
        }
      }
    }

    // Если нет ни реплая, ни текста (и это не просто добавление кнопок к реплаю)
    // Если реплай есть, contentText может быть пустым (просто добавляем кнопки)
    if (!replyMessage && !contentText) {
      await ctx.reply(ctx.t("broadcast.error-no-text"));
      return;
    }

    const users = await User.find({});

    if (users.length === 0) {
      await ctx.reply("Нет пользователей для рассылки.");
      return;
    }

    let success = 0;
    let failure = 0;

    await ctx.reply(ctx.t("broadcast.start", { count: users.length }));

    for (const user of users) {
      if (!user.telegram_id) continue;

      try {
        if (replyMessage) {
          // copyMessage копирует сообщение полностью (медиа, форматирование, кнопки если есть)
          // Добавляем клавиатуру, если она была создана
          await ctx.api.copyMessage(user.telegram_id, ctx.chat!.id, replyMessage.message_id, {
            reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined
          });
        } else {
          // Отправка текста с поддержкой HTML
          await ctx.api.sendMessage(user.telegram_id, contentText, {
            parse_mode: "HTML",
            reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined
          });
        }
        success++;
      } catch (e) {
        failure++;
      }
      // Небольшая задержка, чтобы не превысить лимиты Telegram
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    await ctx.reply(ctx.t("broadcast.report", { success, failure }));
  }
}
