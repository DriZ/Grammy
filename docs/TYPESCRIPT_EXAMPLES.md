# 💡 TypeScript Примеры из проекта

Этот файл содержит реальные примеры TypeScript кода из проекта с объяснениями.

---

## 1️⃣ Базовая типизация - Команда ping

**Файл:** `commands/fun/ping.ts`

```typescript
import Command from "../../structures/Command.js";
import { Context } from "telegraf";
import type BotClient from "../../core/Client.js";

// Наследуем типизированный abstract класс
export default class PingCommand extends Command {
  // Типизированный конструктор
  constructor(client: BotClient) {
    super(client, {
      description: "Проверить скорость отклика бота",
      aliases: ["p", "pong"],
    });
  }

  // Реализуем abstract метод с правильной типизацией
  async execute(ctx: Context): Promise<void> {
    // Context содержит полную информацию о сообщении
    const sent = await ctx.reply("Pong! 🏓");

    // Optional chaining - ctx.message может быть undefined
    const latency = (sent.message_id || 0) - (ctx.message?.message_id || 0);

    await ctx.reply(`Latency: ${latency}ms`);
  }
}
```

### 🔍 Что здесь важного:

- `import type` - импортируем только для типов (не включается в .js)
- `extends Command` - наследуем базовый класс
- `async ... Promise<void>` - асинхронный метод, не возвращает данные
- `ctx: Context` - контекст типизирован
- `ctx.message?.message_id` - optional chaining для безопасности

---

## 2️⃣ Интерфейсы и конфигурация

**Файл:** `config.ts`

```typescript
// Interface описывает структуру конфигурации
// TypeScript проверит, что мы передали все нужные поля
interface BotConfig {
  owner: number | null; // number или null
  admins: number[]; // массив чисел
  permissions: {
    EVERYONE: 0;
    ADMIN: 1;
    OWNER: 2;
  };
}

// Типизированная переменная
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

export default config;
```

### 🔍 Что здесь важного:

- `interface BotConfig` - описание структуры
- `number | null` - union type "число ИЛИ null"
- `number[]` - массив чисел
- Типизация гарантирует правильность данных
- IDE подсказывает при обращении к `config.owner`

---

## 3️⃣ Обработка команд с типизацией

**Файл:** `core/commandHandler.ts` (часть)

```typescript
export default class CommandHandler {
  // Типизированные свойства класса
  private client: BotClient;

  // Map с типизацией ключ-значение
  private commands: Map<string, Command>;
  private aliases: Map<string, string>;

  constructor(client: BotClient) {
    this.client = client;
    this.commands = new Map();
    this.aliases = new Map();
  }

  // Функция с полной типизацией
  async loadCommand(commandPath: string): Promise<void> {
    if (!this._ifPath(commandPath)) {
      throw new Error(`Файл команды не найден: ${commandPath}`);
    }

    // Динамический импорт с типизацией
    const module = await import(`file://${commandPath}`);
    const command = new module.default(this.client) as Command;

    // Работа с Map
    this.commands.set(command.info.name, command);

    // Регистрируем в Telegraf с типизацией контекста
    const handler = (ctx: Context) => this.executeCommand(command, ctx);
    this.client.command(command.info.name, handler);
  }

  // Возвращает Command или null (не undefined)
  getCommand(name: string): Command | null {
    if (this.commands.has(name)) {
      return this.commands.get(name) || null;
    }
    if (this.aliases.has(name)) {
      const commandName = this.aliases.get(name);
      return this.commands.get(commandName || "") || null;
    }
    return null;
  }

  // Проверка прав доступа с типизацией
  async executeCommand(command: Command, ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const isOwner = config.owner && userId === config.owner;
    const isAdmin = config.admins.includes(userId || 0);

    if (command.config.permission && command.config.permission > 0) {
      if (command.config.permission === 2 && !isOwner) {
        return void (await ctx.reply(
          `❌ Эта команда доступна только владельцу.`,
        ));
      }
    }

    try {
      await command.execute(ctx);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Ошибка в команде ${command.info.name}:`, errorMsg);
      await ctx.reply(`❌ Произошла ошибка при выполнении команды`);
    }
  }
}
```

### 🔍 Что здесь важного:

- `private` - свойство недоступно снаружи класса
- `Map<K, V>` - типизированная карта
- `Promise<void>` - асинхронная функция, не возвращает данные
- `as Command` - type assertion когда мы уверены в типе
- `error instanceof Error` - проверка типа в runtime
- `void (await ...)` - подавляем возвращаемое значение

---

## 4️⃣ Abstract классы и наследование

**Файл:** `structures/Command.ts`

```typescript
// Интерфейсы для типизации опций
export interface CommandOptions {
  name?: string;
  description?: string;
  aliases?: string[];
  permission?: number;
  enabled?: boolean;
}

// Abstract класс - шаблон для всех команд
export default abstract class Command {
  // Protected - доступно в классе и подклассах
  protected client: BotClient;

  // Public свойства
  public info: CommandInfo;
  public config: CommandConfig;

  constructor(client: BotClient, options: CommandOptions = {}) {
    this.client = client;

    // Деструктуризация с default значениями
    const {
      name = null,
      description = "No description provided",
      aliases = [],
      enabled = true,
    } = options;

    // Инициализируем типизированные объекты
    this.config = { permission: 0, location: null, enabled };
    this.info = {
      name: name || "",
      description,
      aliases,
    };
  }

  // Abstract метод - ДОЛЖЕН быть реализован в подклассе
  abstract execute(ctx: Context): Promise<void>;

  // Обычный метод
  async reload(ctx?: Context): Promise<void> {
    // Optional параметр - может быть Context или undefined
    if (!ctx) return;

    const commandPath = this.config.location;
    if (!commandPath) {
      throw new Error(`Cannot reload command: file path not found`);
    }

    // Используем типизированный метод утилит
    await this.client.utils.sleep(500);
    await (this.client as any).commandHandler.loadCommand(commandPath);
  }
}

// ❌ Так нельзя:
// const cmd = new Command(); // Error: Cannot instantiate abstract class

// ✅ Правильно - создаём конкретный класс
class MyCommand extends Command {
  async execute(ctx: Context): Promise<void> {
    // Реализуем abstract метод
  }
}
```

### 🔍 Что здесь важного:

- `abstract class` - нельзя создать инстанс
- `abstract execute()` - метод должен быть реализован
- `protected` - доступно подклассам
- `CommandOptions = {}` - default parameter
- `ctx?: Context` - optional параметр
- Деструктуризация с `=` для default значений

---

## 5️⃣ Generics - универсальные типы

**Файл:** `structures/util.ts`

```typescript
// Generic функция - работает с любым типом T
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

// Использование - TypeScript определяет T автоматически:

// T = number
const numbers = [1, 2, 3, 4, 5, 6];
const chunked = chunkArray(numbers, 2);
// Результат: [[1, 2], [3, 4], [5, 6]]

// T = string
const words = ["hello", "world", "test"];
const chunkedWords = chunkArray(words, 2);
// Результат: [["hello", "world"], ["test"]]

// ❌ Ошибка типа:
// const mixed = chunkArray([1, "hello"], 2); // Error!
```

```typescript
// Union типы для функции
export function parseBoolean(value: string | number | boolean): boolean | null {
  if (typeof value === "string") {
    const val = value.toLowerCase();
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
  } else if (typeof value === "number") {
    return value === 1;
  } else if (typeof value === "boolean") {
    return value;
  }
  return null;
}

// Использование:
parseBoolean("true"); // ✓ OK
parseBoolean(1); // ✓ OK
parseBoolean(true); // ✓ OK
parseBoolean([]); // ❌ Error: не string|number|boolean
```

### 🔍 Что здесь важного:

- `<T>` - generic параметр, заменяется конкретным типом
- `T[]` - массив типа T
- `T[][]` - двумерный массив типа T
- Автоматическое определение T из аргументов
- `T | null` - может быть T или null
- `typeof` для проверки типа в runtime

---

## 6️⃣ Обработка событий с типизацией

**Файл:** `events/message.ts`

```typescript
import Event from "../structures/Event.js";
import { Context } from "telegraf";
import type BotClient from "../core/Client.js";

export default class MessageEvent extends Event {
  constructor(client: BotClient, name: string) {
    super(client, name);
  }

  // Context может содержать разные типы данных
  async execute(ctx: Context): Promise<void> {
    // Безопасная проверка: есть ли сообщение?
    if ("message" in ctx && ctx.message && "text" in ctx.message) {
      const messageText = (ctx.message as any).text;

      console.log(`💬 Сообщение от ${ctx.from?.first_name}: ${messageText}`);
    }
  }
}
```

### 🔍 Что здесь важного:

- `"message" in ctx` - проверяем наличие свойства
- `ctx.from?.first_name` - optional chaining
- `as any` - когда TypeScript не может определить тип
- Defensive programming - проверяем перед использованием

---

## 7️⃣ Интерфейсы для меню

**Файл:** `core/menuHandler.ts`

```typescript
// Интерфейсы для структуры меню
export interface MenuButton {
  text: string;
  action?: (ctx: Context) => Promise<void> | void;
  nextMenu?: string;
}

export interface Menu {
  id: string;
  title: string;
  buttons: MenuButton[];
}

export default class MenuHandler {
  private client: BotClient;
  private menus: Map<string, Menu>;

  // ...

  // Использование интерфейсов
  async showMenu(ctx: Context, id: string): Promise<void> {
    const menu = this.menus.get(id);

    if (!menu) {
      return void (await ctx.reply("❌ Меню не найдено."));
    }

    // TypeScript знает что menu имеет buttons: MenuButton[]
    const buttonTexts = menu.buttons.map((b) => b.text);
    const keyboard = Markup.keyboard(buttonTexts).resize();

    await ctx.reply(menu.title, keyboard);
  }
}
```

### 🔍 Что здесь важного:

- `MenuButton` - определяет структуру кнопки
- `action?: (ctx: Context) => ...` - optional функция
- `Promise<void> | void` - может быть обещание или просто void
- `Map<string, Menu>` - map с типизированным значением
- `.map((b) => b.text)` - TypeScript знает что b имеет свойство text

---

## 8️⃣ Error handling с типизацией

```typescript
// ✅ Правильный error handling
try {
  await command.execute(ctx);
} catch (error) {
  // error может быть чем угодно!
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(`Ошибка: ${errorMsg}`);
}

// ❌ Неправильно:
try {
  // ...
} catch (error) {
  console.error(error.message); // error может не быть Error!
}
```

---

## 📚 Практические советы

### ✅ Хорошие практики:

```typescript
// 1. Типизируйте всё
const userId: number = ctx.from?.id || 0;

// 2. Используйте интерфейсы для объектов
interface UserData {
  id: number;
  name: string;
}

// 3. Используйте union типы вместо любых
type Status = "active" | "inactive" | "pending";

// 4. Возвращайте нужный тип
async function getData(): Promise<UserData | null> {
  // ...
}

// 5. Проверяйте типы перед использованием
if (value && typeof value === "string") {
  // Здесь value точно string
}
```

### ❌ Чего избегать:

```typescript
// Не используйте any без необходимости
const data: any = something;

// Не пропускайте типизацию
async function handler(ctx) {} // ❌ Типы?

// Не полагайтесь на undefined неявно
const value: string = maybeString; // ❌ Может быть undefined!

// Не игнорируйте возвращаемые типы
const result = await doSomething(); // ❌ Какой тип result?
```

---

## 🎯 Вывод

TypeScript делает код:

- **Безопаснее** - ошибки выявляются до запуска
- **Понятнее** - типы описывают намерение
- **Проще** - IDE лучше подсказывает
- **Надёжнее** - меньше runtime ошибок

Используйте эти примеры как шаблон для своего кода! 🚀
