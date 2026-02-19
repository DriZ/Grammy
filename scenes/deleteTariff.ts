import { CallbackContext, WizardScene } from "../types/index.js";
import { Tariff } from "../models/index.js";

const deleteTariffScene: WizardScene<CallbackContext> = {
	name: "delete-tariff",
	steps: [
		async (ctx) => {
			const tariffId = ctx.wizard.state.tariffId;
			if (!tariffId) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось определить тариф для удаления.");
				return ctx.scene.leave();
			}

			const tariff = await Tariff.findById(tariffId);
			if (!tariff) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось найти тариф в БД для удаления.");
				return ctx.scene.leave();
			}

			await ctx.scene.confirmOrCancel(ctx, `Вы уверены, что хотите удалить тариф ${tariff.type}?`);
			return ctx.wizard.next();
		},
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.cancelDeleting(ctx);
				return ctx.scene.leave();
			}

			if (ctx.callbackQuery?.data === "confirm") {
				const tariffId = ctx.wizard.state.tariffId;
				await Tariff.findByIdAndDelete(tariffId);
				await ctx.scene.backToUtilitiesMenu(ctx, "✅ Тариф успешно удалён");
				return ctx.scene.leave();
			}
			return
		},
	],
}

export default deleteTariffScene;