import { CallbackContext, WizardScene } from "../types/index.js";
import { UtilitiesReading } from "../models/index.js";

const deleteReadingScene: WizardScene<CallbackContext> = {
	name: "delete-reading",
	steps: [
		// Шаг 1: Подтверждение удаления
		async (ctx) => {
			const readingId = ctx.wizard.state.readingId;
			if (!readingId) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось определить показание для удаления.");
				return ctx.scene.leave();
			}

			const reading = await UtilitiesReading.findById(readingId);
			if (!reading) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось найти показание в БД для удаления.");
				return ctx.scene.leave();
			}

			ctx.wizard.state.accountId = reading.account_id;

			await ctx.scene.confirmOrCancel(ctx, `Вы уверены, что хотите удалить показания за ${reading.month}.${reading.year}?`);
			return ctx.wizard.next();
		},
		// Шаг 2: Обработка решения
		async (ctx) => {
			const accountId = ctx.wizard.state.accountId;
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.cancelDeleting(ctx, accountId ? `readings-${accountId}` : "utilities-menu");
				return ctx.scene.leave();
			}

			if (ctx.callbackQuery?.data === "confirm") {
				const readingId = ctx.wizard.state.readingId;
				await UtilitiesReading.findByIdAndDelete(readingId);
				await ctx.scene.backToMenu(ctx, "✅ Показания успешно удалены", accountId ? `readings-${accountId}` : "utilities-menu");
				return ctx.scene.leave();
			}
			return
		},
	],
};

export default deleteReadingScene;
