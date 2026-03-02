import { BaseCommand } from "@structures/index.js";
import { EPermissionLevel, type BaseContext } from "@app-types/index.js";
import type BotClient from "@core/Client.js";


export default class WhoamiCommand extends BaseCommand {
  constructor(client: BotClient) {
    super(client, {
      name: "whoami",
      category: "General",
      usage: "/whoami",
      aliases: ["whois"],
      enabled: true,
      location: null,
      description: "Показать информацию о себе",
      permission: EPermissionLevel.Admin,
    });
  }

  async execute(ctx: BaseContext): Promise<void> {
    const user = ctx.from!;

    const info = `
👤 <b>Твоя информация:</b>
├ ID: <code>${user.id}</code>
├ Имя: ${ctx.escapeHTML(user.first_name)}
${user.last_name ? `├ Фамилия: ${ctx.escapeHTML(user.last_name)}` : ""}
├ Username: ${user.username ? `@${ctx.escapeHTML(user.username)}` : "Не установлено"}
└ Статус: ✅ Администратор
    `.trim();

    await ctx.reply(info, { parse_mode: "HTML" });
  }
}
