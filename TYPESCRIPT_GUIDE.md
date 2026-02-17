# 📚 TypeScript в проекте Telegraf - Учебное руководство

## Что такое TypeScript?

**TypeScript** - это надстройка над JavaScript, которая добавляет **статическую типизацию**. Это означает:

- Вы указываете типы переменных, параметров функций и возвращаемых значений
- Ошибки типов выявляются **до запуска** кода (при разработке)
- IDE предоставляет лучшее автодополнение
- Код более надёжен и легче поддерживать

### JavaScript vs TypeScript

```javascript
// ❌ JavaScript - ошибка выявится только при запуске
const userId = "123";
const age = userId + 5; // "1235" - неожиданное поведение!
```

```typescript
// ✅ TypeScript - ошибка выявится сразу при разработке
const userId: number = "123"; // ❌ Type error!
const userId: number = 123; // ✅ Правильно
```

---

## Ключевые концепции TypeScript в проекте

### 1. **Типизация переменных и параметров**

```typescript
// Явная типизация
const name: string = "Bot";
const count: number = 42;
const isActive: boolean = true;

// Типизация функций
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Параметры и возвращаемый тип
async function fetchData(id: number): Promise<string> {
  // ...
}
```

**Где используется в проекте:**

- [index.ts](index.ts#L1) - типизированная главная функция
- [config.ts](config.ts#L1) - интерфейсы для конфигурации

---

### 2. **Интерфейсы (Interface)** - описание структуры данных

```typescript
// Interface - описывает структуру объекта
interface User {
  id: number;
  name: string;
  email?: string; // ? означает необязательное свойство
}

// Использование
const user: User = {
  id: 1,
  name: "John",
  // email опциональное, не нужно указывать
};
```

**Где используется в проекте:**

- [config.ts](config.ts) - `BotConfig`, `CommandInfo`, `CommandConfig`
- [structures/Command.ts](structures/Command.ts) - `CommandOptions`, `CommandInfo`
- [core/menuHandler.ts](core/menuHandler.ts) - `Menu`, `MenuButton`

**Преимущества:**

- TypeScript проверит, что вы передаёте все нужные свойства
- IDE будет знать какие свойства доступны

---

### 3. **Типизированные классы**

```typescript
class BotClient extends Telegraf {
  // Типизированные свойства
  private commandHandler: CommandHandler;
  public utils: typeof utils;

  constructor(token: string) {
    super(token);
    // ...
  }

  async initialize(): Promise<void> {
    // Promise<void> = асинхронная функция, не возвращающая ничего
  }
}
```

**Где используется:**

- [core/Client.ts](core/Client.ts) - основной класс бота
- [structures/Command.ts](structures/Command.ts) - базовый класс команд
- [structures/Event.ts](structures/Event.ts) - базовый класс событий

**Модификаторы доступа:**

- `public` - доступно везде (по умолчанию)
- `private` - доступно только внутри класса
- `protected` - доступно в классе и подклассах

---

### 4. **Абстрактные классы (Abstract)**

```typescript
// Abstract класс - нельзя создать инстанс напрямую
abstract class Command {
  // Abstract метод - ДОЛЖЕН быть реализован в подклассе
  abstract execute(ctx: Context): Promise<void>;
}

// ❌ Так нельзя:
const cmd = new Command(); // Error!

// ✅ Правильно - создаём подкласс:
class PingCommand extends Command {
  async execute(ctx: Context): Promise<void> {
    await ctx.reply("Pong!");
  }
}
```

**Где используется:**

- [structures/Command.ts](structures/Command.ts) - базовый класс для всех команд
- [structures/Event.ts](structures/Event.ts) - базовый класс для всех событий

**Зачем нужны abstract классы:**

- Гарантируют, что подклассы реализуют нужные методы
- Предотвращают неправильное использование

---

### 5. **Union типы (|)** - "один из"

```typescript
// Переменная может быть ОДНИМ из этих типов
type Status = "active" | "inactive" | "pending";

// Параметр может быть строкой или числом
function getId(value: string | number): string {
  return String(value);
}

// Может быть null
const user: User | null = null;
```

**Где используется:**

- [config.ts](config.ts#L20) - `owner: number | null`
- [structures/util.ts](structures/util.ts#L180) - `parseBoolean(...): boolean | null`

---

### 6. **Optional chaining (?.)** - безопасный доступ к свойствам

```typescript
// Без типизации - может быть ошибка
const name = ctx.from.first_name; // ❌ Если ctx.from null, ошибка!

// С optional chaining
const name = ctx.from?.first_name; // ✅ Если null, то undefined вместо ошибки
```

**Где используется:**

- [commands/General/myid.ts](commands/General/myid.ts#L20) - `ctx.from?.id`
- [events/message.ts](events/message.ts#L25) - `ctx.message?.text`

---

### 7. **Type assertion (as)** - принудительное указание типа

```typescript
// Когда TypeScript не может определить точный тип
const data = JSON.parse(json);

// Мы точно знаем что это User
const user = data as User;

// Или:
const user: User = JSON.parse(json);
```

**Где используется:**

- [structures/util.ts](structures/util.ts#L67) - `as { id: string }`
- [core/eventHandler.ts](core/eventHandler.ts#L92) - `as any`

**⚠️ Осторожно:**

- `as any` отключает проверку типов (как в JavaScript)
- Используйте когда действительно знаете что делаете

---

### 8. **Generics (<T>)** - типы-параметры

```typescript
// Generic - функция работает с любым типом
function getFirstElement<T>(arr: T[]): T {
  return arr[0];
}

// TypeScript поймёт тип автоматически
const firstNum = getFirstElement([1, 2, 3]); // T = number
const firstStr = getFirstElement(["a", "b"]); // T = string

// Map с типизацией
const map = new Map<string, User>();
```

**Где используется:**

- [structures/util.ts](structures/util.ts#L246) - `chunkArray<T>(array: T[]): T[][]`
- [core/commandHandler.ts](core/commandHandler.ts#L33) - `Map<string, Command>`

---

### 9. **Record<K, V>** - типизированный объект

```typescript
// Record создаёт объект с типизированными ключами и значениями
type UserMap = Record<number, User>;

const users: UserMap = {
  1: { id: 1, name: "John" },
  2: { id: 2, name: "Jane" },
};

// Похоже на Map<K, V>, но это обычный объект
```

**Где используется:**

- [structures/Client.ts](core/Client.ts#L81) - статусы с Record
- [core/commandHandler.ts](core/commandHandler.ts#L33) - обработка команд

---

## 🏗️ Архитектура TypeScript в проекте

### Структура папок

```
Telegraf/
├── tsconfig.json          ← Конфигурация TypeScript
├── package.json           ← Зависимости + build скрипты
├── dist/                  ← 📦 Скомпилированный код (JavaScript)
│
├── config.ts              ← Конфигурация с интерфейсами
├── index.ts               ← Главный файл
│
├── core/                  ← Основные классы
│   ├── Client.ts          ← Главный класс бота
│   ├── commandHandler.ts  ← Управление командами
│   ├── eventHandler.ts    ← Управление событиями
│   ├── sceneHandler.ts    ← Управление сценами
│   └── menuHandler.ts     ← Управление меню
│
├── structures/            ← Базовые классы
│   ├── Command.ts         ← Abstract класс для команд
│   ├── Event.ts           ← Abstract класс для событий
│   └── util.ts            ← Утилиты с типизацией
│
├── commands/              ← Реализация команд
│   ├── fun/ping.ts
│   ├── admin/whoami.ts
│   └── General/myid.ts
│
├── events/                ← Реализация событий
│   ├── message.ts
│   └── edited_message.ts
│
├── scenes/                ← Сцены (многошаговые диалоги)
│   └── createAccount.ts
│
├── models/                ← Sequelize модели БД
│   └── index.ts
│
└── menus/                 ← Определения меню
```

---

## 🚀 Запуск TypeScript проекта

### Разработка

```bash
# Compile TypeScript
npm run build

# Или используйте ts-node для прямого запуска
npm run dev
```

### Продакшн

```bash
# Скомпилировать
npm run build

# Запустить скомпилированный код
npm start
# Запускает: node -r dotenv/config dist/index.js
```

---

## ✅ Что мы получили переходом на TypeScript

### Преимущества:

1. **Безопасность типов** ✓
   - Ошибки выявляются до запуска
   - IDE сообщает об ошибках

2. **Лучшее автодополнение** ✓
   - IDE знает все доступные свойства и методы
   - Подсказки при вводе кода

3. **Самодокументирующийся код** ✓
   - Тип переменной сразу видно
   - Не нужны комментарии о типах

4. **Легче рефакторить** ✓
   - При изменении интерфейса TypeScript покажет все места, где нужны изменения

5. **Профессиональный стандарт** ✓
   - TypeScript используется в большинстве крупных проектов

### Небольшие минусы:

- Нужно компилировать перед запуском
- Больше "boilerplate" кода
- Изучение синтаксиса TypeScript

---

## 📖 Дальнейшее обучение

### Темы для углубления:

1. **Продвинутые типы**
   - Conditional types: `T extends U ? X : Y`
   - Mapped types: `{[K in keyof T]: T[K]}`
   - Utility types: `Partial`, `Required`, `Readonly`

2. **Декораторы** (экспериментальная фича)
   - Используются в фреймворках как NestJS
   - `@Decorator` синтаксис

3. **Типизация с Telegraf**
   - Правильная типизация `Context`
   - Использование фильтров типов

4. **tsconfig.json опции**
   - `strict` - максимум проверок
   - `skipLibCheck` - пропустить проверку node_modules
   - `declaration` - генерировать .d.ts файлы

---

## 🎯 Практические примеры из проекта

### Пример 1: Типизированная команда

```typescript
// [commands/fun/ping.ts]

// Импортируем типы
import Command from "../../structures/Command.js";
import { Context } from "telegraf";
import type BotClient from "../../core/Client.js";

// Наследуем от типизированного базового класса
export default class PingCommand extends Command {
  // Конструктор с типизацией
  constructor(client: BotClient) {
    super(client, {
      description: "Проверить скорость отклика бота",
      aliases: ["p", "pong"],
    });
  }

  // Abstract метод с типизацией
  async execute(ctx: Context): Promise<void> {
    const sent = await ctx.reply("Pong! 🏓");
    const latency = (sent.message_id || 0) - (ctx.message?.message_id || 0);
    await ctx.reply(`Latency: ${latency}ms`);
  }
}
```

### Пример 2: Типизированная утилита

```typescript
// [structures/util.ts]

// Generic функция для работы с массивами
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Использование:
const numbers = [1, 2, 3, 4, 5, 6];
const chunks = chunkArray(numbers, 2); // T = number
// chunks: [[1, 2], [3, 4], [5, 6]]
```

### Пример 3: Интерфейсы для конфигурации

```typescript
// [config.ts]

interface BotConfig {
  owner: number | null;
  admins: number[];
  permissions: {
    EVERYONE: 0;
    ADMIN: 1;
    OWNER: 2;
  };
}

const config: BotConfig = {
  owner: process.env.BOT_OWNER_ID ? parseInt(process.env.BOT_OWNER_ID) : null,
  admins: process.env.BOT_ADMINS
    ? process.env.BOT_ADMINS.split(",").map((id) => parseInt(id.trim()))
    : [],
  permissions: {
    EVERYONE: 0,
    ADMIN: 1,
    OWNER: 2,
  },
};
```

---

## 📚 Полезные ссылки

- [TypeScript Official Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive (на русском)](https://basarat.gitbook.io/typescript/)
- [Telegraf Typings](https://github.com/telegraf/telegraf/tree/develop/typings)

---

**Проект успешно переписан на TypeScript! 🎉**

Все файлы скомпилированы в папку `dist/` и готовы к запуску.
