# 📚 Индекс документации по типам

## 🎯 Начните с этого

Если вы **новичок** в проекте, начните читать в этом порядке:

1. **[TYPES_CENTRALIZATION.md](TYPES_CENTRALIZATION.md)** ⭐ _Начните отсюда_
   - Что такое централизованные типы
   - Какие файлы были изменены
   - Преимущества нового подхода
   - Как использовать

2. **[TYPES_DOCUMENTATION.md](TYPES_DOCUMENTATION.md)** 📖 _Подробная справка_
   - Все интерфейсы объяснены
   - Примеры использования каждого типа
   - Type guards и проверка типов
   - Лучшие практики

3. **[TYPES_IMPORT_EXAMPLES.md](TYPES_IMPORT_EXAMPLES.md)** 💡 _Примеры из проекта_
   - Реальные примеры импорта
   - Как используется в разных модулях
   - Правильные и неправильные способы

---

## 📁 Файл типов

### [types/index.ts](types/index.ts)

Основной файл со всеми типами (252 строки):

```typescript
// 📦 Импортируйте отсюда
import type { BotConfig, Menu, CommandInfo } from "./types/index.js";
```

**Содержит:**

- `BotConfig` - конфигурация бота
- `CommandInfo`, `CommandConfig`, `CommandOptions` - типы команд
- `MenuButton`, `Menu` - типы меню
- `TelegramUser` - информация о пользователе
- `CreateAccountWizardState`, `MyWizardContext` - состояние сцены
- `StatusItem`, `OrderItem` - данные от API
- `Storage<T>`, `AsyncResult<T>` - generic типы
- Type guards: `isBotConfig()`, `isMenu()`, `isMenuButton()`

---

## 🗂️ Карта типов

### По назначению

**🤖 Конфигурация**

- [BotConfig](TYPES_DOCUMENTATION.md#botconfig-🤖) - конфигурация бота

**📋 Команды**

- [CommandInfo](TYPES_DOCUMENTATION.md#commandinfo-) - информация о команде
- [CommandConfig](TYPES_DOCUMENTATION.md#commandconfig-) - конфиг команды
- [CommandOptions](TYPES_DOCUMENTATION.md#commandoptions-) - опции создания

**🔘 Меню**

- [MenuButton](TYPES_DOCUMENTATION.md#menubutton-) - кнопка меню
- [Menu](TYPES_DOCUMENTATION.md#menu-) - структура меню

**👤 Пользователи**

- [TelegramUser](TYPES_DOCUMENTATION.md#telegramuser-) - пользователь Telegram
- [CreateAccountWizardState](TYPES_DOCUMENTATION.md#createaccountwizardstate-) - состояние формы

**🔌 API**

- [StatusItem](TYPES_DOCUMENTATION.md#statusitem-) - статус от сервера
- [OrderItem](TYPES_DOCUMENTATION.md#orderitem-) - заказ

---

## 🔍 Быстрый поиск

| Нужно                       | Где найти                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| Примеры импорта типов       | [TYPES_IMPORT_EXAMPLES.md](TYPES_IMPORT_EXAMPLES.md)                                                 |
| Объяснение конкретного типа | [TYPES_DOCUMENTATION.md](TYPES_DOCUMENTATION.md)                                                     |
| Что изменилось в проекте    | [TYPES_CENTRALIZATION.md](TYPES_CENTRALIZATION.md)                                                   |
| Как добавить новый тип      | [TYPES_DOCUMENTATION.md#🔄-добавление-новых-типов](TYPES_DOCUMENTATION.md#🔄-добавление-новых-типов) |
| Лучшие практики             | [TYPES_DOCUMENTATION.md#💡-лучшие-практики](TYPES_DOCUMENTATION.md#💡-лучшие-практики)               |

---

## 💻 Код примеров

### Самый простой пример

```typescript
// 1. Импортируйте тип
import type { BotConfig } from "./types/index.js";

// 2. Используйте в коде
const config: BotConfig = {
  owner: 123456,
  admins: [789, 1011],
  permissions: { EVERYONE: 0, ADMIN: 1, OWNER: 2 },
};

// 3. Скомпилируйте
// npm run build
```

### Импорт нескольких типов

```typescript
import type { Menu, MenuButton, CommandInfo } from "./types/index.js";

const menuButton: MenuButton = { text: "Главное меню" };
const menu: Menu = { id: "main", title: "Меню", buttons: [menuButton] };
```

### Type guards для проверки

```typescript
import { isBotConfig, type BotConfig } from "./types/index.js";

const data = JSON.parse(jsonString);

if (isBotConfig(data)) {
  // Теперь TypeScript знает что это BotConfig
  console.log(data.owner);
}
```

---

## 📊 Статистика

- **Файлы типов:** 1 файл ([types/index.ts](types/index.ts))
- **Строк в файле:** 252 строки
- **Интерфейсов:** 12+
- **Type guards:** 3 функции
- **Документация:** 3 файла (TYPES\_\*.md)

---

## 🚀 Частые задачи

### Найти тип для конфигурации

👉 [BotConfig](TYPES_DOCUMENTATION.md#botconfig-🤖)

### Найти типы для команды

👉 [CommandInfo, CommandConfig, CommandOptions](TYPES_DOCUMENTATION.md#commandinfo-)

### Найти типы для меню

👉 [Menu, MenuButton](TYPES_DOCUMENTATION.md#menubutton-)

### Добавить новый тип

👉 [TYPES_DOCUMENTATION.md#🔄-добавление-новых-типов](TYPES_DOCUMENTATION.md#🔄-добавление-новых-типов)

### Узнать как импортировать

👉 [TYPES_IMPORT_EXAMPLES.md](TYPES_IMPORT_EXAMPLES.md)

---

## 📖 Чтение по уровню

### 🟢 Новичок

1. [TYPES_CENTRALIZATION.md](TYPES_CENTRALIZATION.md) - обзор изменений
2. [TYPES_IMPORT_EXAMPLES.md](TYPES_IMPORT_EXAMPLES.md) - примеры
3. [types/index.ts](types/index.ts) - смотрите исходный код

### 🟡 Опытный

1. [TYPES_DOCUMENTATION.md](TYPES_DOCUMENTATION.md) - полная справка
2. [types/index.ts](types/index.ts) - изучите все типы
3. [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md) - TypeScript концепции

### 🔴 Эксперт

1. [types/index.ts](types/index.ts) - смотрите исходный код
2. Читайте всю документацию
3. Добавляйте новые типы по мере надобности

---

## 🎓 Обучающая последовательность

```
1️⃣  TYPES_CENTRALIZATION.md
     └─ Понимание что произошло

2️⃣  TYPES_DOCUMENTATION.md
     └─ Каждый тип объяснен

3️⃣  TYPES_IMPORT_EXAMPLES.md
     └─ Примеры использования

4️⃣  types/index.ts
     └─ Читайте исходный код

5️⃣  Начните использовать типы в своем коде!
```

---

## ✅ Проверка знаний

После прочтения документации вы должны знать:

- [ ] Где находятся все типы проекта
- [ ] Как импортировать типы
- [ ] Разницу между `import` и `import type`
- [ ] Как использовать type guards
- [ ] Как добавить новый тип
- [ ] Какие типы есть для разных частей проекта

---

## 🔗 Связанная документация

- [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md) - TypeScript концепции
- [TYPESCRIPT_EXAMPLES.md](TYPESCRIPT_EXAMPLES.md) - примеры кода
- [README_TS.md](README_TS.md) - как запустить проект
- [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) - общая сводка

---

## 💬 Вопросы?

Если у вас есть вопросы:

1. **О типах** - смотрите [TYPES_DOCUMENTATION.md](TYPES_DOCUMENTATION.md)
2. **Как использовать** - смотрите [TYPES_IMPORT_EXAMPLES.md](TYPES_IMPORT_EXAMPLES.md)
3. **О TypeScript** - смотрите [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md)
4. **Что изменилось** - смотрите [TYPES_CENTRALIZATION.md](TYPES_CENTRALIZATION.md)

---

## 📞 Навигация

- 🏠 **Главная:** [README.md](README.md) или [README_TS.md](README_TS.md)
- 🎓 **Обучение:** [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md)
- 📖 **Типы:** Этот файл (вы здесь!)
- 💡 **Примеры:** [TYPESCRIPT_EXAMPLES.md](TYPESCRIPT_EXAMPLES.md)
- 🎉 **Итоги:** [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)

---

**Рекомендуем начать с [TYPES_CENTRALIZATION.md](TYPES_CENTRALIZATION.md)** 👈

Это займет всего 5 минут и объяснит все что произошло! 🚀
