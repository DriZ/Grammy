import { SessionContext, WizardScene } from "../types/index.js";


export class SceneManager {
	private scenes = new Map<string, WizardScene<SessionContext>>();

	register(scene: WizardScene<SessionContext>) {
		this.scenes.set(scene.name, scene);
	}

	async enter(ctx: SessionContext, sceneName: string) {
		const scene = this.scenes.get(sceneName);
		if (!scene) throw new Error(`Scene ${sceneName} not found`);
		ctx.session.currentScene = sceneName;
		ctx.session.step = 0;
		ctx.session.wizardState = {};
		console.log(`Вход в сцену ${ctx.session.currentScene}`)
		await scene.steps[0](ctx);
	}

	async handle(ctx: SessionContext) {
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

	async next(ctx: SessionContext) {
		const sceneName = ctx.session.currentScene;
		if (!sceneName) return;

		const scene = this.scenes.get(sceneName);
		if (!scene) return;

		ctx.session.step = (ctx.session.step ?? 0) + 1;
		console.log(`Шаг изменился на ${ctx.session.step}`);
	}


	async back(ctx: SessionContext) {
		const sceneName = ctx.session.currentScene;
		if (!sceneName) return;

		const scene = this.scenes.get(sceneName);
		if (!scene) return;

		ctx.session.step = Math.max((ctx.session.step ?? 0) - 1, 0);
		console.log(`Шаг изменился на ${ctx.session.step}`);
	}


	async selectStep(ctx: SessionContext, stepIndex: number) {
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


	async leave(ctx: SessionContext) {
		console.log(`Сцена остановлена: ${ctx.session.currentScene}`)
		ctx.session.currentScene = null;
		ctx.session.step = 0;
		ctx.session.wizardState = {};
		ctx.session.params = {};
	}

	getScene(name: string): WizardScene<SessionContext> | null {
		return this.scenes.get(name) || null;
	}
}