import { Tariff } from "../models/index.js";
import type { CallbackContext } from "../types/index.js";
import { InlineKeyboard } from "grammy";
import { BaseMenu } from "../core/structures/index.js";
import type BotClient from "../core/Client.js";

export class TariffsMenu extends BaseMenu {
	constructor(client: BotClient, private accountId: string) {
		super(client, `tariffs-${accountId}`);
	}

	get title() {
		return "💰 Тарифы";
	}

	async execute(ctx: CallbackContext) {
		const tariffs = await Tariff.find({ account_id: this.accountId }).sort({
			startDate: -1,
		});
		const keyboard = new InlineKeyboard();

		if (tariffs.length > 0) {
			tariffs.forEach((t) => {
				ctx.services.menuManager.registerMenu(
					`tariff-${t._id.toString()}`,
					new TariffMenu(this.client, t._id.toString(), this.accountId),
				);

				const month = t.startDate.getMonth() + 1;
				const year = t.startDate.getFullYear();

				const zonesStr = t.zones.map((z) => `${z.name}: ${z.price}₴`).join(", ");
				keyboard.text(`${month.toString().padStart(2, "0")}.${year}: ${zonesStr}`, `tariff-${t._id}`).row();
			});
		}

		keyboard.text("➕ Добавить тариф", `create-tariff-${this.accountId}`).row();
		keyboard.text("⬅️ Назад", `menu-back`);

		if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText("💰 Тарифы:", { reply_markup: keyboard });
		else await ctx.reply("💰 Тарифы:", { reply_markup: keyboard });
	}
}

export class TariffMenu extends BaseMenu {
	constructor(client: BotClient, private tariffId: string, private accountId: string) {
		super(client, `tariff-${tariffId}`);
	}

	get title() {
		return "💰 Тариф";
	}

	async execute(ctx: CallbackContext) {
		const tariff = await Tariff.findById(this.tariffId);
		if (!tariff) {
			await ctx.reply("❌ Тариф не найден");
			return;
		}

		const zonesStr = tariff.zones.map((z) => `${z.name}: ${z.price.toLocaleString('ru-RU', { style: 'currency', currency: 'UAH', currencyDisplay: 'symbol' })}`).join("\n");

		const keyboard = new InlineKeyboard()
			.text("🗑️ Удалить тариф", `delete-tariff-${this.tariffId}`).danger()
			.row()
			.text("⬅️ Назад", `menu-back`);

		const title = `💰 Тариф (${tariff.type})\n${zonesStr}\nНачало действия: ${tariff.startDate.toLocaleDateString('ru-RU')}`;

		if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
		else await ctx.reply(title, { reply_markup: keyboard });
	}
}
