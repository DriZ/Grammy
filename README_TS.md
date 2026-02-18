# 🚀 Шаблон Telegram-бота на grammY и TypeScript

Мощный и масштабируемый шаблон для создания Telegram-ботов с использованием **grammY** и **TypeScript**. Проект обеспечивает полную статическую типизацию для надежной и безопасной разработки.

---

<p align="center">
  <img src="https://img.shields.io/badge/grammY-v1.x-blue?logo=telegram" alt="grammY">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

## 📖 Документация по миграции на TypeScript

Если вы впервые работаете с этим проектом или хотите понять, как он был переписан на TypeScript, прочитайте:

1. **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - краткое резюме миграции
2. **[TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md)** - полное руководство по TypeScript
3. **[TYPESCRIPT_EXAMPLES.md](TYPESCRIPT_EXAMPLES.md)** - примеры кода из проекта

---

## ⚙️ Установка и запуск

### Требования

- Node.js 18+
- npm или yarn

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

### Компиляция TypeScript

```bash
npm run build
```

Код скомпилируется в папку `dist/`

### Запуск продакшена

```bash
npm start
```

---

## 📁 Структура проекта

```
.
├── config.ts                 ← Конфигурация бота
├── index.ts                  ← Точка входа
│
├── core/                     ← Основной функционал
│   ├── Client.ts            ← Главный класс бота
│   ├── commandHandler.ts    ← Управление командами
│   ├── eventHandler.ts      ← Управление событиями
│   ├── sceneHandler.ts      ← Управление сценами (диалоги)
│   └── menuHandler.ts       ← Управление меню
│
├── structures/              ← Базовые классы
│   ├── Command.ts          ← Abstract класс для команд
│   ├── Event.ts            ← Abstract класс для событий
│   └── util.ts             ← Утилиты
│
├── commands/               ← Команды бота
│   ├── fun/               ← Развлекательные команды
│   │   └── ping.ts
│   ├── admin/             ← Команды администраторов
│   │   ├── whoami.ts
│   │   └── reboot.ts
│   └── General/           ← Основные команды
│       └── myid.ts
│
├── events/                ← События бота
│   ├── message.ts         ← Обработка сообщений
│   └── edited_message.ts  ← Обработка редактирования
│
├── scenes/                ← Сцены (многошаговые диалоги)
│   └── createAccount.ts
│
├── models/                ← Sequelize модели БД
│   └── index.ts
│
├── menus/                 ← Определения меню
│   └── mainMenu.ts
│
├── dist/                  ← Скомпилированный JavaScript (после npm run build)
│
├── tsconfig.json          ← Конфигурация TypeScript
├── package.json           ← Зависимости и скрипты
└── .env                   ← Переменные окружения (не в git)
```

---

## 🔧 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Telegram Bot Token
TOKEN=your_bot_token_here

# Администраторы и владелец
BOT_OWNER_ID=123456789
BOT_ADMINS=123456789,987654321

# Database (для Sequelize)
DATABASE_URL=postgresql://user:password@localhost:5432/telegraf

# Azure/Microsoft Graph (для работы с Excel/OneDrive)
AZURE_CLIENT_ID=your_client_id
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_SECRET=your_client_secret
```

---

## 🎮 Создание новой команды

### Структура команды

```typescript
// commands/category/mycommand.ts

import Command from "../../structures/Command.js";
import { Context } from "telegraf";
import type BotClient from "../../core/Client.js";

export default class MyCommand extends Command {
	constructor(client: BotClient) {
		super(client, {
			description: "Описание команды",
			aliases: ["short", "alias"], // Альтернативные имена
			permission: 0, // 0=все, 1=админ, 2=владелец
		});
	}

	async execute(ctx: Context): Promise<void> {
		// Ваш код здесь
		await ctx.reply("Ответ бота");
	}
}
```

### Типизация

- `permission: 0` - доступна всем
- `permission: 1` - только администраторам
- `permission: 2` - только владельцу

---

## 📢 Создание события

### Структура события

```typescript
// events/myevent.ts

import Event from "../structures/Event.js";
import { Context } from "telegraf";
import type BotClient from "../core/Client.js";

export default class MyEvent extends Event {
	constructor(client: BotClient, name: string) {
		super(client, name);
	}

	async execute(ctx: Context): Promise<void> {
		// Ваш код здесь
		console.log("Событие сработало!");
	}
}
```

События загружаются из папки `events/` и срабатывают на соответствующие события Telegram.

---

## 🔑 Ключевые концепции

### Типизация функций

```typescript
async function loadCommands(dir: string): Promise<Map<string, Command>> {
	// ...
}
```

### Интерфейсы

```typescript
interface UserConfig {
	id: number;
	name: string;
	role?: "admin" | "user";
}
```

### Abstract классы

```typescript
abstract class Command {
	abstract execute(ctx: Context): Promise<void>;
}
```

### Union типы

```typescript
type Permission = 0 | 1 | 2;
```

### Optional chaining

```typescript
const userId = ctx.from?.id;
```

Подробнее - см. [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md) и [TYPESCRIPT_EXAMPLES.md](TYPESCRIPT_EXAMPLES.md)

---

## 📚 Основные библиотеки

- **grammy** - Основной фреймворк для работы с Telegram Bot API.
- **@grammyjs/hydrate** - плагин для улучшения контекста.
- **sequelize** - ORM для БД
- **axios** - HTTP клиент
- **dotenv** - Загрузка переменных окружения
- **TypeScript** - Статическая типизация

---

## 🧪 Проверка типов

```bash
# Только проверить типы без компиляции
npx tsc --noEmit

# Компилировать с исходными картами для отладки
npm run build
```

---

## 🔐 Безопасность

- Проверка прав доступа в `commandHandler.ts`
- Валидация типов на уровне TypeScript
- Обработка ошибок в try-catch блоках
- Безопасный доступ к данным с optional chaining

---

## 🚨 Проблемы и решения

### Ошибка: "Cannot find module"

```bash
# Убедитесь что вы скомпилировали:
npm run build
```

### Ошибка типов при импорте

```typescript
// Используйте .js расширение в импортах
import Command from "../../structures/Command.js"; // ✓
import Command from "../../structures/Command.ts"; // ❌
```

### "Property does not exist on type"

```typescript
// Типизируйте переменные
const user: BotUser = await getUser();
```

---

## 📖 Дополнительная информация

- [grammY документация](https://grammy.dev/)
- [TypeScript справочник](https://www.typescriptlang.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 📝 Лицензия

MIT

---

## 👨‍💻 Контрибьютинг

При добавлении нового кода:

1. ✅ Типизируйте все параметры
2. ✅ Используйте интерфейсы для объектов
3. ✅ Запускайте `npm run build` перед коммитом
4. ✅ Следуйте стилю кода проекта

---

**Проект полностью переписан на TypeScript! 🎉**

Для обучения TypeScript читайте:

- [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md) - полное руководство
- [TYPESCRIPT_EXAMPLES.md](TYPESCRIPT_EXAMPLES.md) - примеры кода
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - что было сделано
