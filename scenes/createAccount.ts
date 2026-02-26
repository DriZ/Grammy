import { type CallbackContext, EResource, type TResourceType, type TStepHandler } from "@app-types/index.js";
import { Account, MeterType } from "@models/index.js";
import { InlineKeyboard } from "grammy";
import { BaseScene } from "@core/structures/BaseScene.js";
import type BotClient from "@core/Client.js";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

export default class CreateAccountScene extends BaseScene {
	constructor(client: BotClient) {
		super(client, "create-account");
	}

	get steps(): TStepHandler[] {
		return [this.askResource, this.handleResource, this.handleMeterType, this.handleAccountNumber];
	}

	// Шаг 0: выбор ресурса
	private askResource = async (ctx: CallbackContext) => {
		await ctx.callbackQuery?.message?.editText("Выберите тип ресурса:", {
			reply_markup: new InlineKeyboard()
				.text("⚡ Электричество", EResource.electricity.name)
				.row()
				.text("💧 Вода", EResource.water.name)
				.row()
				.text("🔥 Газ", EResource.gas.name)
				.row()
				.text("Отмена", "cancel"),
		});
		return ctx.wizard.next();
	};

	// Шаг 1: обработка ресурса
	private handleResource = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;

		ctx.wizard.state.resource = ctx.update.callback_query?.data as TResourceType;

		if (ctx.wizard.state.resource === EResource.electricity.name) {
			await ctx.callbackQuery?.message?.editText("Выберите тип счётчика:", {
				reply_markup: new InlineKeyboard()
					.text("Однотарифный", MeterType.SINGLE)
					.row()
					.text("День/Ночь", MeterType.DAY_NIGHT)
					.row()
					.text("Пик/Полупик/Ночь", MeterType.MULTI_ZONE)
					.row()
					.text("Отмена", "cancel"),
			});
			return ctx.wizard.next();
		}

		// если вода/газ → сразу спрашиваем номер счёта
		await ctx.callbackQuery?.message?.editText(
			`Тип ресурса: ${ctx.wizard.state.resource}\n\nВведите номер счёта:`,
			{ reply_markup: cancelBtn },
		);
		ctx.wizard.state.message = ctx.callbackQuery?.message;
		return ctx.wizard.selectStep(ctx, 3); // перескакиваем на шаг ввода номера
	};

	// Шаг 2: выбор типа счётчика (только для electricity)
	private handleMeterType = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;

		ctx.wizard.state.meterType = ctx.update.callback_query?.data;

		await ctx.callbackQuery?.message?.editText(
			`Ресурс: ${EResource[ctx.wizard.state.resource].emoji} ${ctx.wizard.state.resource}, счётчик: ${ctx.wizard.state.meterType}\n\nВведите номер счёта:`,
			{ reply_markup: cancelBtn },
		);
		ctx.wizard.state.message = ctx.callbackQuery?.message;
		return ctx.wizard.next();
	};

	// Шаг 3: ввод номера счёта
	private handleAccountNumber = async (ctx: CallbackContext) => {
		if (await this.checkCancel(ctx, "❌ Создание счёта отменено.")) return;

		if (!ctx.update.message?.text) {
			await ctx.wizard.state.message.editText(
				`Ресурс: ${EResource[ctx.wizard.state.resource].emoji} ${ctx.wizard.state.resource}, счётчик: ${ctx.wizard.state.meterType ?? "стандартный"}\n\n
					Введите номер счёта:`, {
				reply_markup: cancelBtn
			}
			);
			return
		}

		const accountNumber = ctx.update.message?.text;
		const resource = ctx.wizard.state.resource;
		const meterType = ctx.wizard.state.meterType;
		const addressId = ctx.wizard.state.addressId;

		await ctx.update.message?.delete().catch(() => { });

		try {
			await Account.create({
				account_number: accountNumber,
				resource,
				address_id: addressId,
				meterType
			});

			await ctx.scene.backToMenu(ctx, `✅ Счёт ${accountNumber} (${EResource[resource].emoji} ${resource}${meterType ? ", счётчик: " + meterType : ""}) успешно добавлен.`, `address-${addressId}`);
		} catch (error) {
			return this.handleError(ctx, error, "❌ Ошибка при создании счёта.", `address-${addressId}`);
		}
		return ctx.scene.leave();
	};
}
