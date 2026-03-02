import { BaseCommand } from "@structures/index.js";
import type BotClient from "@core/Client.js";
import { type BaseContext, EPermissionLevel } from "@app-types/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

export default class VersionCommand extends BaseCommand {
  constructor(client: BotClient) {
    super(client, {
      name: "version",
      description: "Показать текущую версию бота",
      category: "General",
      usage: "/version",
      permission: EPermissionLevel.User,
      aliases: ["v", "ver", "about"],
    });
  }

  async execute(ctx: BaseContext): Promise<void> {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    let version = "Unknown";

    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        version = packageJson.version;
      }
    } catch (e) {
      console.error("Error reading package.json:", e);
    }

    // В продакшене файлы пересоздаются при билде, поэтому время изменения этого файла = время сборки
    const stats = fs.statSync(__filename);
    const buildDate = stats.mtime;

    const uptimeSeconds = process.uptime();
    const uptime = this.formatUptime(uptimeSeconds);

    await ctx.reply(
      `🤖 <b>Версия бота:</b> <code>v${version}</code>\n` +
      `📅 <b>Дата сборки:</b> <code>${buildDate.toLocaleString("ru-RU")}</code>\n` +
      `⏱ <b>Аптайм:</b> <code>${uptime}</code>`,
      { parse_mode: "HTML" }
    );
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}д`);
    if (h > 0) parts.push(`${h}ч`);
    if (m > 0) parts.push(`${m}м`);
    if (s > 0) parts.push(`${s}с`);

    return parts.join(" ") || "0с";
  }
}
