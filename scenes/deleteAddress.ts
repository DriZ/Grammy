import { CallbackContext, WizardScene } from "../types/index.js";
import { Address } from "../models/index.js";
import { deleteAddress } from "../dbServices/index.js";


const deleteAccountScene: WizardScene<CallbackContext> = {
	name: "delete-address",
	steps: [
		async (ctx) => {
			const addressId = ctx.wizard.state.addressId;
			if (!addressId) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось определить адрес для удаления.");
				return ctx.scene.leave();
			}

			const address = await Address.findById(addressId);
			if (!address) {
				await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка: не удалось найти адрес в БД для удаления.");
				return ctx.scene.leave();
			}

			await ctx.scene.confirmOrCancel(ctx, `Вы уверены, что хотите удалить адрес ${address?.name}?`);
			return ctx.wizard.next();
		},
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.scene.cancelDeleting(ctx);
				return ctx.scene.leave();
			}

			if (ctx.callbackQuery?.data === "confirm") {
				const addressId = ctx.wizard.state.addressId;
				try {
					const result = await deleteAddress(addressId, ctx.from.id);
					const msg = result.deletedAll
						? "✅ Адрес и все связанные данные успешно удалены."
						: "✅ Адрес отвязан от вашего профиля.";

					await ctx.scene.backToUtilitiesMenu(ctx, msg);
				} catch (err) {
					console.error(err);
					await ctx.scene.backToUtilitiesMenu(ctx, "❌ Ошибка при удалении адреса.");
				}
				return ctx.scene.leave();
			}
			return
		},
	],
};

export default deleteAccountScene;
