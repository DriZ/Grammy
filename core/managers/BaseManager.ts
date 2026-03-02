import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import type BotClient from "../Client.js";
import { glob } from "glob";

export abstract class BaseManager {
  constructor(protected client: BotClient) { }

  /**
   * Логирование информационного сообщения с именем класса
   */
  protected log(message: string, ...args: unknown[]) {
    console.log(`[${this.constructor.name}] ${message}`, ...args);
  }

  /**
   * Логирование ошибки с именем класса
   */
  protected error(message: string, ...args: unknown[]) {
    console.error(`[${this.constructor.name}] ❌ ${message}`, ...args);
  }

  /**
   * Логирование предупреждения с именем класса
   */
  protected warn(message: string, ...args: unknown[]) {
    console.warn(`[${this.constructor.name}] ⚠️ ${message}`, ...args);
  }

  /**
   * Безопасно импортирует модуль по указанному пути.
   * @param path Путь к файлу (или URL)
   * @returns Модуль или null, если произошла ошибка
   */
  protected async importModule<T = unknown>(path: string): Promise<T | null>{
    try {
      return await import(path);
    } catch (error) {
      this.error(`Failed to import module: ${path}`, error);
      return null;
    }
  }

  /**
   * Сканирует директорию, находит файлы по паттерну и загружает их.
   * @param directory Полный путь к директории
   * @param pattern Паттерн поиска (по умолчанию **\/*.{js,ts})
   * @param callback Функция, которая будет вызвана для каждого успешно загруженного модуля
   */
  protected async loadFiles<T = unknown>(
    directory: string,
    pattern: string = "**/*.{js}",
    callback: (module: T, filepath: string) => Promise<void> | void
  ) {
    if (!fs.existsSync(directory)) {
      this.warn(`Directory not found: ${directory}`);
      return;
    }

    this.log(`ℹ️ Searching in: ${directory}`);
    const files = await glob(pattern, { cwd: directory });
    this.log(`ℹ️ Found ${files.length} files.`);

    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directory, file);
        const fileUrl = pathToFileURL(filePath).href;
        const module = await this.importModule(fileUrl);
        if (module) {
          await callback(module as T, filePath);
        }
      })
    );
  }
}
