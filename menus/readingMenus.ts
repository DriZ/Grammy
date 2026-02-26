import { Account, UtilitiesReading } from "@models/index.js";
import { type CallbackContext, EResource } from "@app-types/index.js";
import { InlineKeyboard } from "grammy";
import { BaseMenu } from "@structures/index.js";
import type BotClient from "@core/Client.js";


export class ReadingsMenu extends BaseMenu {
	constructor(client: BotClient, private accountId: string, private year?: number) {
		super(client, year ? `readings-${accountId}-${year}` : `readings-${accountId}`);
	}

	get title() {
		return "📊 Показания";
	}

	async execute(ctx: CallbackContext) {
		let selectedYear = this.year;
		if (!selectedYear) {
			const latestReading = await UtilitiesReading.findOne({ account_id: this.accountId }).sort({ year: -1 });
			selectedYear = latestReading ? latestReading.year : new Date().getFullYear();
		}

		const readings = await UtilitiesReading.find({
			account_id: this.accountId,
			year: selectedYear
		}).sort({
			month: -1,
		});
		const keyboard = new InlineKeyboard();

		// Расчет годового потребления
		let consumptionText = "";
		const prevYearDecReading = await UtilitiesReading.findOne({
			account_id: this.accountId,
			year: selectedYear - 1,
			month: 12,
		});

		const latestReadingInSelectedYear = await UtilitiesReading.findOne({
			account_id: this.accountId,
			year: selectedYear,
		}).sort({ month: -1 });

		if (prevYearDecReading && latestReadingInSelectedYear) {
			let totalConsumption = 0;
			for (const currentZone of latestReadingInSelectedYear.zones) {
				const prevZone = prevYearDecReading.zones.find((z) => z.name === currentZone.name);
				if (prevZone) {
					const consumption = currentZone.value - prevZone.value;
					if (consumption >= 0) {
						totalConsumption += consumption;
					}
				}
			}

			if (totalConsumption > 0) {
				const account = await Account.findById(this.accountId);
				if (account) {
					const unit = account.resource === "electricity" ? "кВт·ч" : "м³";
					consumptionText = ` | Потребление: ${totalConsumption.toFixed(0)} ${unit}`;
				}
			}
		}

		if (readings.length > 0) {
			readings.forEach((r) => {
				ctx.services.menuManager.registerMenu(
					`reading-${r._id.toString()}`,
					new ReadingMenu(this.client, r._id.toString(), this.accountId),
				);

				// формируем строку из зон
				const zonesStr = r.zones.map((z) => `${z.name}: ${z.value}`).join(", ");
				keyboard
					.text(
						`${r.month.toString().padStart(2, "0")}.${r.year} → ${zonesStr}`,
						`reading-${r._id}`,
					)
					.row();
			});
		}

		// Пагинация по годам
		keyboard
			.text(`⬅️ ${selectedYear - 1}`, `readings-${this.accountId}-${selectedYear - 1}`)
			.text(`📅 ${selectedYear}`, `readings-${this.accountId}-${selectedYear}`)
			.text(`${selectedYear + 1} ➡️`, `readings-${this.accountId}-${selectedYear + 1}`)
			.row();

		keyboard.text("➕ Добавить показания", `create-reading-${this.accountId}`).row();
		keyboard.text("⬅️ Назад", `menu-back`);

		const account = await Account.findById(this.accountId);
		if (!account) {
			throw new Error(`Счёт с id ${this.accountId} не найден`);
		}
		const title = `📊 Показания за ${selectedYear} год (${EResource[account.resource].emoji ?? ""
			} №${account.account_number})${consumptionText}`;

		if (ctx.callbackQuery) {
			await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
		} else {
			await ctx.reply(title, { reply_markup: keyboard });
		}
	}
}

export class ReadingMenu extends BaseMenu {
	constructor(client: BotClient, private readingId: string, private accountId: string) {
		super(client, `reading-${readingId}`);
	}

	get title() {
		return "📊 Показание";
	}

	async execute(ctx: CallbackContext) {
		const reading = await UtilitiesReading.findById(this.readingId);

		if (!reading) {
			await ctx.reply("❌ Показание не найдено");
			return;
		}

		// формируем строку из зон
		const zonesStr = reading.zones.map((z) => `${z.name}: ${z.value}`).join("\n");

		const keyboard = new InlineKeyboard()
			.text("🗑️ Удалить показание", `delete-reading-${this.readingId}`).danger()
			.row()
			.text("⬅️ Назад", `menu-back`);

		const title = `📊 Показание за ${reading.month}.${reading.year}:\n${zonesStr}`;

		if (ctx.callbackQuery) await ctx.callbackQuery.message?.editText(title, { reply_markup: keyboard });
		else await ctx.reply(title, { reply_markup: keyboard });
	}
}
