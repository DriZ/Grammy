import { CallbackContext, WizardScene } from "../types/index.js";
import { Address } from "../models/index.js";
import { InlineKeyboard } from "grammy";
import { deleteAddress } from "../dbServices/index.js";

const cancelBtn = new InlineKeyboard().text("Отмена", "cancel").danger();

const deleteAccountScene: WizardScene<CallbackContext> = {
	name: "delete-address",
	steps: [
		async (ctx) => {
			const addressId = ctx.wizard.params.addressId;
			if (!addressId) {
				await ctx.callbackQuery?.message?.editText("❌ Ошибка: не удалось определить адрес для удаления.", {
					reply_markup: cancelBtn
				});
				return ctx.scene.leave();
			}
			const address = await Address.findById(addressId);
			await ctx.callbackQuery?.message?.editText(`Вы уверены, что хотите удалить адрес ${address?.name}?`, {
				reply_markup: new InlineKeyboard()
					.text('Удалить', 'confirm').danger()
					.text('Отмена', 'cancel')
			});
			return ctx.wizard.next();
		},
		async (ctx) => {
			if (ctx.callbackQuery?.data === "cancel") {
				await ctx.callbackQuery.message?.editText("❌ Удаление отменено.", {
					reply_markup: new InlineKeyboard()
						.text('Назад', 'utilities-menu')
				});
				return ctx.scene.leave();
			}

			if (ctx.callbackQuery?.data === "confirm") {
				const addressId = ctx.wizard.params.addressId;
				try {
					const result = await deleteAddress(addressId, ctx.from.id);
					const msg = result.deletedAll
						? "✅ Адрес и все связанные данные успешно удалены."
						: "✅ Адрес отвязан от вашего профиля.";

					await ctx.callbackQuery.message?.editText(msg, {
						reply_markup: new InlineKeyboard().text('Назад', 'utilities-menu')
					});
				} catch (err) {
					console.error(err);
					await ctx.callbackQuery.message?.editText("❌ Ошибка при удалении адреса.", {
						reply_markup: new InlineKeyboard().text("⬅️ Назад", "utilities-menu"),
					});
				}
			}
			return ctx.scene.leave();
		}
	]
}

export default deleteAccountScene;
