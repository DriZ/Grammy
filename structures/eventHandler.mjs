import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class EventHandler {
    constructor(client) {
        this.client = client;
        this._events = new Map();
    }

    async loadEvents(eventsDir = null) {
        if (!eventsDir) {
            eventsDir = path.join(__dirname, "..", "events");
        }

        // Проверяем, существует ли папка events
        if (!fs.existsSync(eventsDir)) {
            console.warn(`⚠️  Папка events не найдена: ${eventsDir}`);
            return this._events;
        }

        const files = fs.readdirSync(eventsDir).filter(file => file.endsWith(".mjs"));

        for (const file of files) {
            const filePath = path.join(eventsDir, file);
			const eventName = file.replace(".mjs", "");
            try {
                const module = await import(`file://${filePath}`);
                const event = new module.default(this.client, eventName);

                if (!event.name) {
                    console.warn(`⚠️  Событие в файле ${file} не имеет имени. Пропускаю...`);
                    continue;
                }

                if (typeof event.execute !== 'function') {
                    console.warn(`⚠️  Событие ${file} не имеет метода execute(). Пропускаю...`);
                    console.log(`   Event object:`, event);
                    continue;
                }

                // Регистрируем событие
                this._events.set(event.name, event);

                // Регистрируем событие в Telegraf
                if (event.once) {
                    // Если это одноразовое событие
                    this.client.once(event.info.name, async (ctx) => {
                        try {
                            console.log(`🔔 Одноразовое событие сработало: ${event.info.name}`);
                            await event.execute(ctx);
                        } catch (err) {
                            console.error(`❌ Ошибка в событии ${event.info.name}:`, err);
                        }
                    });
                    console.log(`✅ Одноразовое событие загружено: ${event.info.name}`);
                } else {
                    // Обычное событие
                    this.client.on(event.name, async (ctx) => {
                        try {
                            console.log(`🔔 Событие сработало: ${event.name}`);
                            await event.execute(ctx);
                        } catch (err) {
                            console.error(`❌ Ошибка в событии ${event.name}:`, err);
                        }
                    });
                    console.log(`✅ Событие загружено: ${event.name}`);
                }
            } catch (error) {
                console.error(`❌ Ошибка при загрузке события ${file}:`, error);
            }
        }

        console.log(`\n📦 Всего событий загружено: ${this._events.size}`);
        return this._events;
    }

    getEvent(name) {
        return this._events.get(name) || null;
    }

    getAllEvents() {
        return this._events;
    }
}
