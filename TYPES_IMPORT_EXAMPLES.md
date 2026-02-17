// ============================================================
// 📖 Примеры импорта и использования типов
// ============================================================
//
// Этот файл показывает как правильно импортировать и
// использовать типы из types/index.ts в разных местах проекта

// ============================================================
// 1️⃣ Конфигурация (config.ts)
// ============================================================

import type { BotConfig } from "./types/index.js";

// Используем тип для переменной
const config: BotConfig = {
  owner: 123456789,
  admins: [111111, 222222, 333333],
  permissions: {
    EVERYONE: 0,
    ADMIN: 1,
    OWNER: 2,
  },
};

export default config;

// ============================================================
// 2️⃣ Основной клиент бота (core/Client.ts)
// ============================================================

import { Telegraf, Context } from "telegraf";
import type { StatusItem, OrderItem } from "../types/index.js";

export default class BotClient extends Telegraf {
  // Типизируем методы параметрами из types
  private async loadSalesdriveStatuses(): Promise<void> {
    try {
      // response.data будет типизирован как StatusItem[]
      const response = await axios.get<StatusItem[]>(
        `${this.SALESDRIVES_BASE_URL}/status/list/`,
        {
          headers: { "X-Api-Key": this.SALESDRIVES_API_KEY },
        },
      );

      // TypeScript знает, что это StatusItem[]
      const statuses: StatusItem[] = response.data;
      console.log(`Загружено ${statuses.length} статусов`);
    } catch (err) {
      console.error("Ошибка загрузки статусов:", err);
    }
  }
}

// ============================================================
// 3️⃣ Обработчик меню (core/menuHandler.ts)
// ============================================================

import { Context, Markup } from "telegraf";
import type { Menu, MenuButton } from "../types/index.js";

export default class MenuHandler {
  // Все меню типизированы как Menu
  private menus: Map<string, Menu> = new Map();

  // Функция с типизированными параметрами
  async showMenu(ctx: Context, menuId: string): Promise<void> {
    const menu = this.menus.get(menuId);

    // TypeScript знает структуру Menu
    if (menu) {
      const buttons: MenuButton[] = menu.buttons;
      // buttons имеет правильные свойства: text, action, nextMenu
    }
  }

  // Пример: создание меню с типизацией
  private createMainMenu(): Menu {
    return {
      id: "main-menu",
      title: "🏠 Главное меню",
      buttons: [
        {
          text: "👤 Профиль",
          nextMenu: "profile-menu",
        } as MenuButton,
        {
          text: "⚙️ Настройки",
          action: async (ctx: Context) => {
            await ctx.reply("Настройки");
          },
        } as MenuButton,
      ],
    };
  }
}

// ============================================================
// 4️⃣ Базовый класс команды (structures/Command.ts)
// ============================================================

import { Context } from "telegraf";
import type {
  CommandInfo,
  CommandConfig,
  CommandOptions,
} from "../types/index.js";

export default abstract class Command {
  public info: CommandInfo;
  public config: CommandConfig;

  constructor(options: CommandOptions = {}) {
    // Все свойства типизированы из CommandOptions
    this.info = {
      name: options.name || "",
      description: options.description || "",
      aliases: options.aliases || [],
      category: options.category || "general",
      usage: options.usage || `/${options.name}`,
    };

    this.config = {
      permission: options.permission || 0,
      location: options.location || null,
      enabled: options.enabled !== false,
    };
  }

  abstract execute(ctx: Context): Promise<void>;
}

// ============================================================
// 5️⃣ Пример команды (commands/admin/whoami.ts)
// ============================================================

import Command from "../../structures/Command.js";
import { Context } from "telegraf";
import type { TelegramUser } from "../../types/index.js";

export default class WhoAmICommand extends Command {
  constructor() {
    super({
      name: "whoami",
      description: "Показать информацию о пользователе",
      category: "admin",
      permission: 1,
    });
  }

  async execute(ctx: Context): Promise<void> {
    // Типизируем пользователя через TelegramUser
    const user: TelegramUser = ctx.from as TelegramUser;

    // TypeScript проверяет свойства
    const message =
      `ID: ${user.id}\n` +
      `Имя: ${user.first_name}\n` +
      `Фамилия: ${user.last_name || "-"}\n` +
      `Username: ${user.username ? "@" + user.username : "-"}`;

    await ctx.reply(message);
  }
}

// ============================================================
// 6️⃣ Сцена wizard (scenes/createAccount.ts)
// ============================================================

import { Scenes } from "telegraf";
import type {
  CreateAccountWizardState,
  MyWizardContext,
} from "../types/index.js";

// Используем состояние сцены
const scene = new Scenes.WizardScene<MyWizardContext>(
  "create-account",
  // Шаг 1: получение ресурса
  (ctx: MyWizardContext) => {
    // Состояние типизировано как CreateAccountWizardState
    ctx.wizard.state.cursor = 1;
    ctx.reply("Введите название ресурса:");
    return ctx.wizard.next();
  },

  // Шаг 2: подтверждение
  (ctx: MyWizardContext) => {
    if (ctx.message && "text" in ctx.message) {
      // Сохраняем в типизированное состояние
      ctx.wizard.state.resource = ctx.message.text;
      ctx.reply(`Создан ресурс: ${ctx.wizard.state.resource}`);
    }
    return ctx.scene.leave();
  },
);

export default scene;

// ============================================================
// 7️⃣ Использование Type Guards
// ============================================================

import { isBotConfig, isMenu, isMenuButton } from "./types/index.js";

// Функция с type guard
function processConfig(data: unknown): void {
  // Type guard проверяет тип в runtime
  if (isBotConfig(data)) {
    // Теперь TypeScript знает, что это BotConfig
    console.log(`Владелец: ${data.owner}`);
    console.log(`Админы: ${data.admins.join(", ")}`);
    console.log(`Уровни доступа:`, data.permissions);
  } else {
    console.error("Неверная структура конфигурации");
  }
}

// Проверка меню
function processMenu(data: unknown): void {
  if (isMenu(data)) {
    // Теперь это Menu
    console.log(`Меню: ${data.id}`);
    data.buttons.forEach((btn) => {
      console.log(`  - ${btn.text}`);
    });
  }
}

// Проверка кнопки
function processButton(data: unknown): void {
  if (isMenuButton(data)) {
    // Это MenuButton
    console.log(`Кнопка: ${data.text}`);
    if (data.nextMenu) {
      console.log(`  Переход в: ${data.nextMenu}`);
    }
  }
}

// ============================================================
// 8️⃣ Использование Generic типов
// ============================================================

import type { Storage, AsyncResult, ErrorHandler } from "./types/index.js";

// Хранилище команд
const commands: Storage<Command> = new Map();
commands.set("ping", new PingCommand());
commands.set("whoami", new WhoAmICommand());

// Результат асинхронной операции
async function fetchUserData(userId: number): Promise<AsyncResult<User>> {
  try {
    const user = await database.users.findById(userId);
    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
    };
  }
}

// Обработчик ошибок
const errorHandler: ErrorHandler = async (error: Error) => {
  console.error("Ошибка:", error.message);
  // Отправить уведомление и т.д.
};

// ============================================================
// 9️⃣ Работа с конфигурацией логирования
// ============================================================

import type { LogConfig } from "./types/index.js";

const logConfig: LogConfig = {
  level: "info",
  timestamp: true,
  colorize: true,
};

function setupLogger(config: LogConfig): void {
  console.log(`Уровень: ${config.level}`);
  console.log(`Время: ${config.timestamp ? "да" : "нет"}`);
  console.log(`Цвета: ${config.colorize ? "да" : "нет"}`);
}

// ============================================================
// 🔟 Лучшие практики импорта
// ============================================================

// ✅ ПРАВИЛЬНО - импорт только типов
import type { BotConfig, CommandInfo } from "./types/index.js";

// ✅ ПРАВИЛЬНО - если нужны функции и типы
import { isBotConfig, type BotConfig } from "./types/index.js";

// ❌ НЕПРАВИЛЬНО - импорт типов как значений
// import { BotConfig } from "./types/index.js"; // это увеличит размер бандла!

// ============================================================
// 11️⃣ Проверка типов при разработке
// ============================================================

// Команда проверки типов:
// npm run build

// Если вы видите ошибки, исправьте их:
// 1. Проверьте что используете правильные типы
// 2. Убедитесь что все свойства типизированы
// 3. Используйте type guards для неизвестных данных

// ============================================================
// 1️⃣2️⃣ Расширение типов
// ============================================================

// Если вам нужно расширить существующий тип:

// В types/index.ts добавьте новый интерфейс
export interface ExtendedUser extends TelegramUser {
  isVerified?: boolean;
  joinDate?: Date;
}

// Затем используйте в коде
const extendedUser: ExtendedUser = {
  id: 123,
  first_name: "John",
  is_bot: false,
  isVerified: true,
};

// ============================================================
// Больше информации
// ============================================================
// 📖 Полная документация типов: TYPES_DOCUMENTATION.md
// 📚 Гайд по TypeScript: TYPESCRIPT_GUIDE.md
// 💡 Примеры из проекта: TYPESCRIPT_EXAMPLES.md
