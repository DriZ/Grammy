# 📦 Типы TypeScript проекта

## Введение

Все типы и интерфейсы проекта централизованы в файле [types/index.ts](types/index.ts). Это облегчает:

- ✅ Периспользование типов в разных модулях
- ✅ Поддержку типов в одном месте
- ✅ Экспорт из единой точки доступа
- ✅ Документацию типов

---

## 📋 Структура файла типов

Файл разделён на логические секции:

```typescript
import { Context, Scenes } from "telegraf";

// 1️⃣ Конфигурация и доступ
export interface BotConfig { ... }

// 2️⃣ Команды
export interface CommandInfo { ... }
export interface CommandConfig { ... }
export interface CommandOptions { ... }

// 3️⃣ Меню и кнопки
export interface MenuButton { ... }
export interface Menu { ... }

// 4️⃣ Пользователи
export interface TelegramUser { ... }
export interface CreateAccountWizardState { ... }
export type MyWizardContext = Scenes.WizardContext<CreateAccountWizardState>;

// 5️⃣ API и сервисы
export interface StatusItem { ... }
export interface OrderItem { ... }

// 6️⃣ Утилиты
export type Storage<T> = Map<string, T>;
export type ErrorHandler = (error: Error) => Promise<void> | void;
// ... и т.д.

// 7️⃣ Type Guards (проверка типов в runtime)
export function isBotConfig(value: unknown): value is BotConfig { ... }
export function isMenu(value: unknown): value is Menu { ... }
export function isMenuButton(value: unknown): value is MenuButton { ... }
```

---

## 🔧 Как использовать типы

### Импорт типов

```typescript
// config.ts - импортируем BotConfig
import type { BotConfig } from "./types/index.js";

// Client.ts - импортируем StatusItem и OrderItem
import type { StatusItem, OrderItem } from "../types/index.js";

// Command.ts - импортируем все типы для команд
import type {
  CommandInfo,
  CommandConfig,
  CommandOptions,
} from "../types/index.js";
```

**Важно:** Используйте `import type` для импорта только типов (это не увеличивает размер бандла).

### Использование в коде

```typescript
// config.ts
const config: BotConfig = {
  owner: 123456,
  admins: [789, 1011],
  permissions: {
    EVERYONE: 0,
    ADMIN: 1,
    OWNER: 2,
  },
};

// Client.ts при работе с API
async loadSalesdriveStatuses(): Promise<void> {
  const response = await axios.get<StatusItem[]>(
    `${this.SALESDRIVES_BASE_URL}/status/list/`,
    {
      headers: { "X-Api-Key": this.SALESDRIVES_API_KEY },
    }
  );
  // response.data уже типизирован как StatusItem[]
}

// Команда
async execute(ctx: Context): Promise<void> {
  const user: TelegramUser = ctx.from as TelegramUser;
  console.log(user.first_name);
}
```

---

## 📚 Справка по интерфейсам

### BotConfig 🤖

Конфигурация бота.

```typescript
interface BotConfig {
  owner: number | null; // ID владельца (или null)
  admins: number[]; // Массив ID админов
  permissions: {
    EVERYONE: 0; // Уровень доступа: все
    ADMIN: 1; // Уровень доступа: админ
    OWNER: 2; // Уровень доступа: владелец
  };
}
```

**Используется в:** config.ts

---

### CommandInfo 📋

Информация о команде (метаданные).

```typescript
interface CommandInfo {
  name: string; // Название: "ping", "whoami"
  description: string; // Описание: "Проверка задержки"
  aliases: string[]; // Альтернативные имена: ["/p", "/пинг"]
  category: string; // Категория: "fun", "admin", "utils"
  usage: string; // Как использовать: "/ping"
}
```

**Используется в:** structures/Command.ts

---

### CommandConfig 🔧

Конфигурация команды (права и состояние).

```typescript
interface CommandConfig {
  permission: number; // Уровень доступа (0, 1, 2)
  location: string | null; // Путь к файлу команды или null
  enabled: boolean; // Включена ли команда
}
```

**Используется в:** structures/Command.ts

---

### CommandOptions ⚙️

Опции для создания команды.

```typescript
interface CommandOptions {
  name?: string; // Опционально: название
  description?: string; // Опционально: описание
  aliases?: string[]; // Опционально: альтернативные имена
  category?: string; // Опционально: категория
  usage?: string; // Опционально: подсказка по использованию
  permission?: number; // Опционально: уровень доступа
  location?: string | null; // Опционально: путь к файлу
  enabled?: boolean; // Опционально: включена ли
}
```

**Используется в:** structures/Command.ts (в конструкторе)

---

### MenuButton 🔘

Кнопка в меню.

```typescript
interface MenuButton {
  text: string; // Текст на кнопке
  action?: (ctx: Context) => Promise<void> | void; // Функция-обработчик
  nextMenu?: string; // ID следующего меню
}
```

**Используется в:** core/menuHandler.ts

**Пример:**

```typescript
const button: MenuButton = {
  text: "Главное меню",
  action: (ctx) => console.log("Нажали"),
  nextMenu: "main-menu",
};
```

---

### Menu 🎯

Структура меню.

```typescript
interface Menu {
  id: string; // ID меню: "main-menu", "admin-menu"
  title: string; // Заголовок меню
  buttons: MenuButton[]; // Массив кнопок
}
```

**Используется в:** core/menuHandler.ts

**Пример:**

```typescript
const mainMenu: Menu = {
  id: "main-menu",
  title: "Главное меню",
  buttons: [
    { text: "Профиль", nextMenu: "profile" },
    { text: "Настройки", nextMenu: "settings" },
  ],
};
```

---

### TelegramUser 👤

Информация о пользователе Telegram.

```typescript
interface TelegramUser {
  id: number; // ID пользователя
  first_name: string; // Имя
  last_name?: string; // Фамилия (опционально)
  username?: string; // Username без @ (опционально)
  is_bot: boolean; // Является ли ботом
}
```

**Используется в:** commands/admin/whoami.ts

---

### CreateAccountWizardState 🧙

Состояние сцены создания аккаунта (для wizard-диалогов).

```typescript
interface CreateAccountWizardState {
  resource?: string; // Ресурс (опционально)
  cursor: number; // Текущий шаг wizard
}
```

**Используется в:** scenes/createAccount.ts

---

### StatusItem 📊

Статус заказа от API.

```typescript
interface StatusItem {
  id: number; // ID статуса
  name: string; // Название статуса
  type: string; // Тип статуса
}
```

**Используется в:** core/Client.ts при загрузке статусов с SalesDrive

---

### OrderItem 📦

Заказ с информацией о статусе.

```typescript
interface OrderItem {
  statusId: string | number; // ID статуса заказа
  // Добавьте остальные поля по необходимости
}
```

**Используется в:** core/Client.ts

---

## 🛡️ Type Guards - проверка типов

Type Guard - это функция для проверки типов в runtime.

### isBotConfig()

```typescript
import { isBotConfig } from "./types/index.js";

const data = JSON.parse(jsonString);

if (isBotConfig(data)) {
  // Теперь TypeScript знает, что data это BotConfig
  console.log(data.owner);
} else {
  console.log("Неверная конфигурация");
}
```

### isMenu()

```typescript
import { isMenu } from "./types/index.js";

if (isMenu(obj)) {
  // obj это Menu
  obj.buttons.forEach((btn) => console.log(btn.text));
}
```

### isMenuButton()

```typescript
import { isMenuButton } from "./types/index.js";

if (isMenuButton(value)) {
  // value это MenuButton
  console.log(value.text);
}
```

---

## 💡 Лучшие практики

### ✅ DO: Импортируйте типы с `type`

```typescript
// Правильно - не увеличивает размер бандла
import type { BotConfig } from "./types/index.js";

// Правильно - если нужны функции
import { isBotConfig, type BotConfig } from "./types/index.js";
```

### ❌ DON'T: Импортируйте типы как обычные импорты

```typescript
// Неправильно - добавляет лишний код в бандл
import { BotConfig } from "./types/index.js";
```

### ✅ DO: Добавляйте типы при создании интерфейсов

```typescript
// Правильно
const config: BotConfig = {
  /* ... */
};
const users: Map<number, User> = new Map();

// Правильно для функций
async function processUser(user: TelegramUser): Promise<void> {
  // ...
}
```

### ❌ DON'T: Избегайте использования `any`

```typescript
// Неправильно
const user: any = ctx.from;

// Правильно
const user: TelegramUser = ctx.from as TelegramUser;
```

### ✅ DO: Используйте Generic типы

```typescript
// Правильно - используем Generic типы
const commands: Storage<Command> = new Map();
const results: AsyncResult<StatusItem[]> = {
  success: true,
  data: items,
};
```

---

## 🔄 Добавление новых типов

Если вам нужно добавить новый тип:

1. **Добавьте определение** в [types/index.ts](types/index.ts):

   ```typescript
   export interface NewType {
   field1: string;
   field2: number;
   }
   ```

2. **Используйте в коде**:

   ```typescript
   import type { NewType } from "../types/index.js";
   ```

3. **Если нужна проверка** - добавьте type guard:

   ```typescript
   export function isNewType(value: unknown): value is NewType {
     if (typeof value !== "object" || value === null) return false;
     const obj = value as Record<string, unknown>;
     return typeof obj.field1 === "string" && typeof obj.field2 === "number";
   }
   ```

4. **Скомпилируйте**:

```bash
npm run build
```

---

## 📊 Переиспользование типов

Типы используются в следующих файлах:

```bash
types/index.ts ────────────────────────────────────┐
                                                     │
    ┌───────────────────────────────────────────────┘
    │
    ├─→ config.ts (BotConfig)
    ├─→ core/Client.ts (StatusItem, OrderItem)
    ├─→ core/menuHandler.ts (Menu, MenuButton)
    ├─→ structures/Command.ts (CommandInfo, CommandConfig, CommandOptions)
    ├─→ commands/admin/whoami.ts (TelegramUser)
    └─→ scenes/createAccount.ts (CreateAccountWizardState, MyWizardContext)
```

---

## 🧪 Тестирование типов

```typescript
// Типы проверяются во время компиляции
npm run build

// Если ошибок нет, типы работают правильно!
```

---

## 📝 Шпаргалка

| Для чего             | Используйте                                   |
| -------------------- | --------------------------------------------- |
| Конфиг бота          | `BotConfig`                                   |
| Информацию о команде | `CommandInfo`                                 |
| Создание команды     | `CommandOptions`                              |
| Конфиг команды       | `CommandConfig`                               |
| Кнопку меню          | `MenuButton`                                  |
| Меню                 | `Menu`                                        |
| Пользователя         | `TelegramUser`                                |
| Сцену wizard         | `CreateAccountWizardState`, `MyWizardContext` |
| Данные от API        | `StatusItem`, `OrderItem`                     |
| Проверку типа        | `isBotConfig()`, `isMenu()`, `isMenuButton()` |

---

## 🎯 Итого

- 📦 Все типы в одном файле: `types/index.ts`
- 📚 Используйте `import type` при импорте
- 🛡️ Type guards помогают проверять типы в runtime
- 💡 Добавляйте новые типы по мере развития проекта
- ✅ Проверяйте типы с помощью `npm run build`

**Начните использовать централизованные типы прямо сейчас!** 🚀
