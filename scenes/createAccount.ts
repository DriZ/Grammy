import { CallbackContext, Resource, WizardScene } from "../types/index.js";
import { Account, MeterType } from "../models/index.js";
import { InlineKeyboard } from "grammy";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

const createAccountScene: WizardScene<CallbackContext> = {
	name: "create-account",
	steps: [
		// Шаг 0: выбор ресурса
		async (ctx) => {
			await ctx.callbackQuery?.message?.editText("Выберите тип ресурса:", {
				reply_markup: new InlineKeyboard()
					.text("⚡ Электричество", Resource.electricity.name)
					.row()
					.text("💧 Вода", Resource.water.name)
					.row()
					.text("🔥 Газ", Resource.gas.name)
					.row()
					.text("Отмена", "cancel"),
			});
			return ctx.wizard.next();
		},

		// Шаг 1: обработка ресурса
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Создание счёта отменено.");
				return ctx.scene.leave();
			}

			ctx.wizard.state.resource = ctx.update.callback_query?.data as keyof typeof Resource;

			if (ctx.wizard.state.resource === Resource.electricity.name) {
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
		},

		// Шаг 2: выбор типа счётчика (только для electricity)
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Создание счёта отменено.");
				return ctx.scene.leave();
			}

			ctx.wizard.state.meterType = ctx.update.callback_query?.data;

			await ctx.callbackQuery?.message?.editText(
				`Ресурс: ${Resource[ctx.wizard.state.resource as keyof typeof Resource].emoji} ${ctx.wizard.state.resource}, счётчик: ${ctx.wizard.state.meterType}\n\nВведите номер счёта:`,
				{ reply_markup: cancelBtn },
			);
			ctx.wizard.state.message = ctx.callbackQuery?.message;
			return ctx.wizard.next();
		},

		// Шаг 3: ввод номера счёта
		async (ctx) => {
			if (ctx.update.callback_query?.data === "cancel") {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Создание счёта отменено.");
				return ctx.scene.leave();
			}

			if (!ctx.update.message?.text) {
				await ctx.wizard.state.message.editText(
					`Ресурс: ${Resource[ctx.wizard.state.resource as keyof typeof Resource].emoji} ${ctx.wizard.state.resource}, счётчик: ${ctx.wizard.state.meterType ?? "стандартный"}\n\n
					Введите номер счёта:`, { 
						reply_markup: cancelBtn 
					}
				);
				return
			}

			const accountNumber = ctx.update.message?.text;
			const resource: keyof typeof Resource = ctx.wizard.state.resource;
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

				await ctx.scene.backToMenu(ctx, `✅ Счёт ${accountNumber} (${Resource[resource].emoji} ${resource}${meterType ? ", счётчик: " + meterType : ""}) успешно добавлен.`, `address-${addressId}`);
			} catch (error) {
				console.error(error);
				await ctx.scene.backToMenu(ctx, "❌ Ошибка при создании счёта.", `address-${addressId}`);
			}
			return ctx.scene.leave();
		},
	],
};

export default createAccountScene;
