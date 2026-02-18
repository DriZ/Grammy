import { User, Account, UtilitiesReading, Tariff, Billing } from "../models/index.js";
import type { CallbackContext, WizardScene } from "../types/index.js";

const createUserScene: WizardScene<CallbackContext> = {
	name: "create-user",
	steps: [
		async (ctx: any) => {
			ctx.session = ctx.session || {};
			ctx.session.currentScene = "create-user";
			await ctx.reply("Введите ваше имя:");
			return ctx.wizard.next();
		},
		async (ctx: any) => {
			if (!ctx.message || !("text" in ctx.message)) {
				await ctx.reply("❌ Пожалуйста, отправьте текст.");
				return ctx.wizard.back();
			}
			const name = ctx.message.text;
			const telegramId = ctx.from?.id;
			if (!telegramId) {
				await ctx.reply("❌ Не удалось получить ID.");
				ctx.session.currentScene = null;
				return ctx.scene.leave();
			}
			try {
				const existingUser = await User.findOne({ telegram_id: telegramId });
				if (existingUser) {
					await ctx.reply("⚠️ Пользователь уже существует.");
				} else {
					const newUser = new User({
						telegram_id: telegramId,
						name,
					});
					await newUser.save();
					await ctx.reply(`✅ Пользователь ${name} создан!`);
				}
			} catch (error) {
				console.error("❌ Ошибка при создании пользователя:", error);
				await ctx.reply("❌ Ошибка при создании пользователя.");
			}
			ctx.session.currentScene = null;
			return ctx.scene.leave();
		},
	],
};

export default createUserScene;
