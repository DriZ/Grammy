# 🚀 Шаблон Telegram-бота на grammY и TypeScript

Мощный и масштабируемый шаблон для создания Telegram-ботов с использованием **grammY** и **TypeScript**. Проект обеспечивает полную статическую типизацию для надежной и безопасной разработки.

---

<p align="center">
  <img src="https://img.shields.io/badge/grammY-v1.x-blue?logo=telegram" alt="grammY">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

## 📖 Документация

Этот проект содержит подробную документацию для разработчиков в папке `docs/`:

1. **MIGRATION_SUMMARY.md** - краткое резюме миграции на TypeScript.
2. **TYPESCRIPT_GUIDE.md** - полное руководство по используемым концепциям TypeScript.
3. **TYPESCRIPT_EXAMPLES.md** - примеры кода из проекта.
4. **TYPES_DOCUMENTATION.md** - справочник по типам данных.

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

Код скомпилируется в папку `dist/`.

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
│   ├── admin/             ← Команды администраторов
│   └── General/           ← Основные команды
│
├── events/                ← События бота
│
├── scenes/                ← Сцены (многошаговые диалоги)
│
├── models/                ← Sequelize модели БД
│
├── menus/                 ← Определения меню
│
├── types/                 ← Централизованные типы TypeScript
│
├── dist/                  ← Скомпилированный JavaScript
│
├── tsconfig.json          ← Конфигурация TypeScript
└── .env                   ← Переменные окружения
```

---

## 🔧 Переменные окружения

Создайте файл `.env` в корне проекта (используйте `.env.example` как шаблон):

```env
# Telegram Bot Token
TOKEN=your_bot_token_here

# Администраторы и владелец
BOT_OWNER_ID=123456789
BOT_ADMINS=123456789,987654321

# Database (для Sequelize)
DATABASE_URL=postgresql://user:password@localhost:5432/telegraf
```

---

## 📚 Основные библиотеки

- **grammy** - Основной фреймворк для работы с Telegram Bot API.
- **@grammyjs/hydrate** - плагин для улучшения контекста.
- **dotenv** - Загрузка переменных окружения.
- **TypeScript** - Статическая типизация.

---

## 📝 Лицензия

MIT
