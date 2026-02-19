import { CallbackContext, WizardScene } from "../types/index.js";
import { Address, UserAddress } from "../models/index.js";
import { InlineKeyboard } from "grammy";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel");

const createAddressScene: WizardScene<CallbackContext> = {
	name: "create-address",
	steps: [
		// Шаг 0: запрос адреса
		async (ctx) => {
			ctx.wizard.state.message = ctx.callbackQuery?.message;
			await ctx.callbackQuery?.message?.editText(
				"Введите адрес строкой (например: г. Киев, ул. Крещатик, д. 1, кв. 10):",
				{
					reply_markup: cancelBtn,
				},
			);
			await ctx.wizard.next();
		},

		// Шаг 1: сохранение адреса
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Создание адреса отменено.");
				return ctx.scene.leave();
			}

			if (!ctx.msg?.text) {
				await ctx.wizard.state?.message?.editText("❌ Пожалуйста, введите адрес строкой.", { reply_markup: cancelBtn });
				return
			}

			const addressName = ctx.msg.text;
			await ctx.msg.delete().catch(() => { });

			const telegramId = ctx.from?.id;
			if (!telegramId) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось получить ваш Telegram ID.");
				return ctx.scene.leave();
			}

			try {
				let address = await Address.findOne({ name: addressName });
				if (!address) {
					address = await Address.create({
						name: addressName,
					});
				}

				await UserAddress.create({
					telegram_id: telegramId,
					address_id: address._id,
				});
				
				await ctx.scene.backToUtilitiesMenu(ctx, `✅ Адрес 🏠 ${addressName} успешно добавлен.`);
			} catch (error) {
				console.error(error);
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка при добавлении адреса.");
			}
			return ctx.scene.leave();
		},
	],
};

export default createAddressScene;
