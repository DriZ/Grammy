import { InlineKeyboard } from "grammy";
import { CallbackContext, WizardScene } from "../types/index.js";

export class SceneManager {
	private scenes = new Map<string, WizardScene<CallbackContext>>();

	register(scene: WizardScene<CallbackContext>) {
		this.scenes.set(scene.name, scene);
	}

	async enter(ctx: CallbackContext, sceneName: string) {
		const scene = this.scenes.get(sceneName);
		if (!scene) throw new Error(`Scene ${sceneName} not found`);
		ctx.session.currentScene = sceneName;
		ctx.session.step = 0;
		ctx.session.wizardState ?? (ctx.session.wizardState = {});
		console.log(`Вход в сцену ${ctx.session.currentScene}`);
		await scene.steps[0](ctx);
	}

	async handle(ctx: CallbackContext) {
		const sceneName = ctx.session.currentScene;
		if (!sceneName) return;
		const scene = this.scenes.get(sceneName);
		if (!scene) return;
		const step = ctx.session.step ?? 0;
		const handler = scene.steps[step];
		if (handler) {
			await handler(ctx);
		}
	}

	async next(ctx: CallbackContext) {
		const sceneName = ctx.session.currentScene;
		if (!sceneName) return;

		const scene = this.scenes.get(sceneName);
		if (!scene) return;

		ctx.session.step = (ctx.session.step ?? 0) + 1;
		console.log(`Шаг изменился на ${ctx.session.step}`);
	}

	async back(ctx: CallbackContext) {
		const sceneName = ctx.session.currentScene;
		if (!sceneName) return;

		const scene = this.scenes.get(sceneName);
		if (!scene) return;

		ctx.session.step = Math.max((ctx.session.step ?? 0) - 1, 0);
		console.log(`Шаг изменился на ${ctx.session.step}`);
	}

	async selectStep(ctx: CallbackContext, stepIndex: number) {
		const sceneName = ctx.session.currentScene;
		if (!sceneName) return;

		const scene = this.scenes.get(sceneName);
		if (!scene) return;

		// ограничиваем индекс шагов
		if (stepIndex < 0 || stepIndex >= scene.steps.length) {
			throw new Error(`Step ${stepIndex} out of range for scene ${sceneName}`);
		}

		ctx.session.step = stepIndex;
		console.log(`Перескок на шаг ${ctx.session.step}`);

		// сразу выполняем обработчик нового шага
		const handler = scene.steps[ctx.session.step];
		if (handler) {
			await handler(ctx);
		}
	}

	async leave(ctx: CallbackContext) {
		console.log(`Сцена остановлена: ${ctx.session.currentScene}`);
		ctx.session.currentScene = null;
		ctx.session.step = 0;
		ctx.session.wizardState = {};
	}

	getScene(name: string): WizardScene<CallbackContext> | null {
		return this.scenes.get(name) || null;
	}

	/**
	 * 
	 * @param ctx 
	 * @param text Текст, который будет отправлен в сообщении вместе с клавиатурой
	 */
	async backToUtilitiesMenu(ctx: CallbackContext, text: string) {
		return await this.backToMenu(ctx, text);
	}

	async cancelDeleting(ctx: CallbackContext, menuName?: string) {
		await this.backToMenu(ctx, "❌ Удаление отменено.", menuName);
	}

	async cancleCreating(ctx: CallbackContext, menuName?: string) {
		await this.backToMenu(ctx, "❌ Создание отменено.", menuName);
	}

	async backToMenu(ctx: CallbackContext, text: string, menuName?: string) {
		const keyboard = new InlineKeyboard().text("⬅️ Назад", menuName || "utilities-menu")
		if (ctx.wizard.state.message && ctx.wizard.state.message.text) {
			await ctx.wizard.state.message.editText(text, { reply_markup: keyboard });
			return
		}
		if (ctx.update && ctx.update.message && ctx.update.message.text) {
			await ctx.update.message.editText(text, { reply_markup: keyboard });
			return
		}
		await ctx.callbackQuery.message?.editText(text, { reply_markup: keyboard });
	}

	async confirmOrCancel(ctx: CallbackContext, text: string) {
		await ctx.callbackQuery.message?.editText(text, {
			reply_markup: new InlineKeyboard().text("🗑️ Удалить", "confirm").danger().text("Отмена", "cancel"),
		});
	}
}
