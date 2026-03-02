/* eslint-disable @typescript-eslint/no-explicit-any */
import { type CallbackQueryContext, Context, type FilterQuery, type SessionFlavor } from "grammy";
import { type HydrateFlavor } from "@grammyjs/hydrate";
import type { MenuManager, CommandManager, SceneManager } from "@managers/index.js";
import * as utils from "@core/util.js";
import { type I18nFlavor } from "@grammyjs/i18n"
import type { BaseCommand, BaseMenu, BaseScene, BaseEvent } from "@core/structures";
import type { MessageXFragment, MessageX } from "@grammyjs/hydrate/out/data/message";
import type { MeterType, IAccount } from "@models/account";
import type { MaybeInaccessibleMessage } from "grammy/types";

// ============================================================
// 🤖 Типы конфигурации и уровни доступа
// ============================================================

/**
 * Основная конфигурация бота
 */
export interface IBotConfig {
  owner: number | null;
  admins: number[];
  permissions: typeof EPermissionLevel;
}

/**
 * Информация о команде
 */
export interface CommandInfo {
  name: string;
  description: string;
  aliases: string[];
  category: string;
  usage: string;
}

/**
 * Конфигурация команды
 */
export interface CommandConfig {
  permission: TPermissionLevel;
  location: string | null;
  enabled: boolean;
  showInMenu: boolean;
}

/**
 * Структура команды
 */
export interface CommandBase {
  info: CommandInfo;
  config: CommandConfig;
}

/**
 * Опции для создания команды
 */
export interface CommandOptions {
  name: string;
  description: string;
  aliases?: string[];
  category?: string;
  usage?: string;
  permission: Readonly<TPermissionLevel>;
  location?: string | null;
  enabled?: boolean;
  showInMenu?: boolean;
}

export const EPermissionLevel = {
  User: 0,
  Admin: 1,
  Owner: 2,
} as const;

/** * Уровни прав доступа:
 * - User (0): доступ для всех пользователей
 * - Admin (1): доступ только администраторам или владельцу
 * - Owner (2): доступ только владельцу
 */
export type TPermissionLevel = typeof EPermissionLevel[keyof typeof EPermissionLevel];

/**
 * Данные, сохраняемые в сессию
 */
export interface ISessionData {
  currentScene?: string | null;
  step?: number;
  wizardState?: Record<string, unknown> & Partial<MyWizardState>;
  menuStack: string[];
  currentMenuId?: string;
  language?: string;
}

/**
 * Сервисы, которые будут переданы в контекст для доступа к ним
 */
export interface IServices {
  menuManager: MenuManager;
  sceneManager: SceneManager;
  commandManager: CommandManager;
}

export interface IServicesFlavor {
  services: IServices;
  escapeHTML: typeof utils.escapeHTML;
}

export type BaseContext = HydrateFlavor<Context> & IServicesFlavor & I18nFlavor & {
  resolveText: (text: string | ((ctx: CallbackContext) => string | Promise<string>)) => Promise<string>;
};
export type SessionContext = BaseContext &
  SessionFlavor<ISessionData> & {
    wizard: {
      next: () => Promise<void>;
      back: () => Promise<void>;
      selectStep: (ctx: CallbackContext, stepIndex: number) => Promise<void>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state: Record<string, any> & Partial<MyWizardState>;
    };
    scene: {
      leave: () => Promise<void>;
    };
  };
export type CallbackContext = CallbackQueryContext<SessionContext> & SessionContext;

export interface IScene<C> {
  name: string;
  enter: (ctx: C, params?: object | null) => Promise<void>;
  handle: (ctx: C) => Promise<void>;
  leave?: (ctx: C) => Promise<void>;
}

export interface IWizardScene<C> {
  name: string;
  steps: Array<(ctx: C, params?: object | null) => Promise<void>>;
}

export interface MyWizardState {
  resource: TResourceType;
  meterType: MeterType;
  message: (MessageXFragment & (MessageX & MaybeInaccessibleMessage)) | undefined;
  addressId: string;
  accountNumber: string;
  account: IAccount;
  accountId: string;
  unit: string;
  readingId: string;
  tariffId: string;
  fixedFeeId: string;
  selectedYear: number;
  targetUserId: number;
  reminderId: string;
  hour: number;
  minute: number;
}

/**
* Тип для функции шага сцены
*/
export type TStepHandler = (ctx: CallbackContext) => Promise<void>;

// ============================================================
// 🔘 Типы меню и кнопок
// ============================================================

/**
 * Кнопка в меню
 */
export interface MenuButton {
  text: string | ((ctx: CallbackContext) => string | Promise<string>);
  nextMenu?: string;
  callback: string; // для inline кнопок
  action?: (ctx: CallbackContext) => void;
  row?: boolean;
  style?: "primary" | "success" | "danger";
  skipHistory?: boolean;
}

/**
 * Структура меню
 */
export interface MenuBase {
  id: string;
  title: string | ((ctx: CallbackContext) => string | Promise<string>);
  buttons: MenuButton[] | ((ctx: CallbackContext) => Promise<MenuButton[]> | MenuButton[]);
  callback?: string;
  inline: boolean;
  execute?: (ctx: CallbackContext) => void;
}

export interface IEvent {
  name: FilterQuery;
  once: boolean;
  info: {
    name: string;
  };
}

/**
 * Возвращает имя и эмодзи типа ресурса
 */
export const EResource = {
  electricity: {
    name: "electricity",
    emoji: "⚡️",
    units: ["кВт·ч", "kWh"],
  },
  water: {
    name: "water",
    emoji: "💧",
    units: ["м³", "л", "гал", "ft³"],
  },
  gas: {
    name: "gas",
    emoji: "🔥",
    units: ["м³", "л", "кВт·ч", "kWh", "ft³", "therm"],
  },
  heating: {
    name: "heating",
    emoji: "🌡️",
    units: ["Гкал", "ГДж", "кВт·ч", "МВт·ч"],
  },
  internet: {
    name: "internet",
    emoji: "🌐",
    units: ["мес.", "день"],
  },
  garbage: {
    name: "garbage",
    emoji: "🗑️",
    units: ["чел.", "м²", "ед."],
  },
  other: {
    name: "other",
    emoji: "📦",
    units: ["ед.", "шт."],
  },
} as const;

export type TResource = typeof EResource[keyof typeof EResource]; // Тип значения: { name: "electricity", emoji: "⚡️" } | ...
export type TResourceType = keyof typeof EResource;

export type ZoneReading = {
  name: string; // "day", "night", "peak", "half-peak"
  value: number;
}

// ============================================================
// 👤 Типы пользователя и аккаунта
// ============================================================

/**
 * Информация о пользователе Telegram
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_bot: boolean;
}

/**
 * Состояние для сцены создания аккаунта
 */
export interface CreateAccountWizardState {
  resource?: string;
  cursor: number;
  name: string;
}

// ============================================================
// 🎯 Утилиты и вспомогательные типы
// ============================================================

/**
 * Информация о событии
 */
export interface EventInfo {
  name: string;
  description?: string;
}

/**
 * Generic тип для хранилищ данных
 * Пример: Map<string, Command> для команд
 */
export type Storage<T> = Map<string, T>;

/**
 * Тип функции обработчика ошибок
 */
export type ErrorHandler = (error: Error) => Promise<void> | void;

/**
 * Результат асинхронной операции
 */
export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * Конфигурация логирования
 */
export interface LogConfig {
  level: "debug" | "info" | "warn" | "error";
  timestamp: boolean;
  colorize: boolean;
}

// ============================================================
// 🧩 Типы для конкретных функций
// ============================================================

/**
 * Интерфейс для модулей с default экспортом
 */
export interface IModuleDefault<T> {
  default: new (...args: any[]) => T;
}

export type CommandModule = IModuleDefault<BaseCommand>;
export type MenuModule = IModuleDefault<BaseMenu>;
export type SceneModule = IModuleDefault<BaseScene>;
export type EventModule = IModuleDefault<BaseEvent>;

/**
 * Параметры для функции pluralize
 */
export interface PluralizeOptions {
  count: number;
  singular: string;
  few: string;
  many: string;
}

// ============================================================
// 📝 Type Guards - функции для проверки типов
// ============================================================

/**
 * Проверяет, является ли значение BotConfig
 */
export function isBotConfig(value: unknown): value is IBotConfig {
  if (typeof value !== "object" || value === null) return false;
  const config = value as Record<string, unknown>;
  return (
    typeof config.owner === "number" ||
    (config.owner === null &&
      Array.isArray(config.admins) &&
      typeof config.permissions === "object")
  );
}
