import path from "path";
import { fileURLToPath } from "url";
import type { CallbackContext, SceneModule } from "@app-types/index.js";
import { BaseScene } from "@structures/index.js";
import { BaseManager } from "./BaseManager.js";
import type BotClient from "../Client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type SceneMiddleware = (ctx: CallbackContext, sceneName: string, next: () => Promise<void>) => Promise<void>;

export class SceneManager extends BaseManager {
  private scenes = new Map<string, BaseScene>();
  private middlewares: SceneMiddleware[] = [];

  constructor(client: BotClient) {
    super(client);
  }

  register(scene: BaseScene) {
    this.scenes.set(scene.name, scene);
  }

  /**
   * Регистрирует глобальный middleware, который выполняется перед входом в любую сцену.
   */
  use(middleware: SceneMiddleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Автоматически загружает сцены из папки scenes
   */
  async loadScenes(scenesDir: string = path.join(__dirname, "..", "..", "scenes")): Promise<void> {
    await this.loadFiles<SceneModule>(scenesDir, "**/*.js", async (module) => {
      const SceneClass = module.default;

      // Пропускаем, если это не класс или нет default export
      if (!SceneClass || typeof SceneClass !== "function") return;

      // Проверяем, является ли класс наследником BaseScene
      if (SceneClass.prototype instanceof BaseScene) {
        const sceneInstance = new SceneClass(this.client);
        // Регистрируем сцену
        this.register(sceneInstance);
        this.log(`✅ Scene loaded: ${sceneInstance.name}`);
      }
    });
  }

  async enter(ctx: CallbackContext, sceneName: string) {
    const scene = this.scenes.get(sceneName);
    if (!scene) throw new Error(`Scene ${sceneName} not found`);

    const runMiddlewares = async (i: number) => {
      if (i < this.middlewares.length) {
        await this.middlewares[i](ctx, sceneName, () => runMiddlewares(i + 1));
      } else {
        ctx.session.currentScene = sceneName;
        ctx.session.step = 0;
        ctx.session.wizardState ?? (ctx.session.wizardState = {});
        this.log(`Вход в сцену ${ctx.session.currentScene}`);
        if (scene.steps.length > 0) {
          await scene.steps[0](ctx);
        } else {
          this.warn(`Scene ${sceneName} has no steps!`);
        }
      }
    };

    await runMiddlewares(0);
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
    this.log(`➡️ Step changed to ${ctx.session.step}`);
  }

  async back(ctx: CallbackContext) {
    const sceneName = ctx.session.currentScene;
    if (!sceneName) return;

    const scene = this.scenes.get(sceneName);
    if (!scene) return;

    ctx.session.step = Math.max((ctx.session.step ?? 0) - 1, 0);
    this.log(`⬅️ Step changed to ${ctx.session.step}`);
  }

  async selectStep(ctx: CallbackContext, stepIndex: number) {
    const sceneName = ctx.session.currentScene;
    if (!sceneName) return;

    const scene = this.scenes.get(sceneName);
    if (!scene) return;

    // ограничиваем индекс шагов
    if (stepIndex < 0 || stepIndex >= scene.steps.length) {
      throw new Error(`[SceneManager] ❌ Step ${stepIndex} out of range for scene ${sceneName}`);
    }

    ctx.session.step = stepIndex;
    this.log(`⤴️ Jumped to step ${ctx.session.step}`);

    // сразу выполняем обработчик нового шага
    const handler = scene.steps[ctx.session.step];
    if (handler) {
      await handler(ctx);
    }
  }

  async leave(ctx: CallbackContext) {
    this.log(`⬇️ Scene left: ${ctx.session.currentScene}`);
    ctx.session.currentScene = null;
    ctx.session.step = 0;
    ctx.session.wizardState = {};
  }

  getScene(name: string): BaseScene | null {
    return this.scenes.get(name) || null;
  }
}
