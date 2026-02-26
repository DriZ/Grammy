import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type BotClient from "@core/Client.js";
import { BaseScene } from "@structures/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Обработчик сцен
 */
export class SceneHandler {
	private client: BotClient;

	constructor(client: BotClient) {
		this.client = client;
	}

	/**
	 * Загрузить одну сцену из файла
	 */
	async loadScene(scenePath: string): Promise<void> {
		if (!fs.existsSync(scenePath)) {
			throw new Error(`⚠️  └─ Файл сцены не найден: ${scenePath}`);
		}

		const module = await import(`file://${scenePath}`);
		const SceneClass = module.default;

		// Проверяем, является ли экспорт классом, наследующим Scene
		if (!SceneClass || !(SceneClass.prototype instanceof BaseScene)) {
			console.warn(`⚠️  └─ Файл ${scenePath} не экспортирует класс сцены.`);
			return;
		}

		// Создаем экземпляр сцены
		const scene = new SceneClass(this.client) as BaseScene;

		// Регистрируем сцену напрямую в SceneManager
		this.client.sceneManager.register(scene);

		console.log(`✅  └─ Сцена ${scene.name} загружена`);
	}

	/**
	 * Загрузить все сцены из директории
	 */
	async loadScenes(scenesDir: string = path.join(__dirname, "..", "..", "scenes")): Promise<void> {
		const files = fs.readdirSync(scenesDir).filter((file) => file.endsWith(".js"));

		console.log(`\n📂 Загрузка сцен из директории: ${scenesDir}`);

		for (const file of files) {
			const filePath = path.join(scenesDir, file);
			try {
				await this.loadScene(filePath);
			} catch (error) {
				console.error(`❌ Ошибка при загрузке сцены из ${filePath}:`, error);
				continue;
			}
		}
	}
}
