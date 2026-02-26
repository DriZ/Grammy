import { type CallbackQueryContext, Context, type FilterQuery, type SessionFlavor } from "grammy";
import { type HydrateFlavor } from "@grammyjs/hydrate";
import type { MenuManager, CommandManager, SceneManager } from "@managers/index.js";
import type { SceneHandler } from "@handlers/index.js";
import * as utils from "@core/util.js";
import { type I18nFlavor } from "@grammyjs/i18n"

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
export interface ICommandInfo {
	name: string;
	description: string;
	aliases: string[];
	category: string;
	usage: string;
}

/**
 * Конфигурация команды
 */
export interface ICommandConfig {
	permission: TPermissionLevel;
	location: string | null;
	enabled: boolean;
	showInMenu: boolean;
}

/**
 * Структура команды
 */
export interface ICommand {
	info: ICommandInfo;
	config: ICommandConfig;
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
 * Опции для создания команды
 */
export interface ICommandOptions {
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

/**
 * Данные, сохраняемые в сессию
 */
export interface ISessionData {
	currentScene?: string | null;
	step?: number;
	wizardState?: Record<string, unknown>;
	menuStack: string[];
	currentMenuId?: string;
	language?: string;
}

/**
 * Сервисы, которые будут переданы в контекст для доступа к ним
 */
export interface IServices {
	menuManager: MenuManager;
	sceneHandler: SceneHandler;
	sceneManager: SceneManager;
	commandManager: CommandManager;
}

export interface IServicesFlavor {
	services: IServices;
	utils: typeof utils;
}

export type BaseContext = HydrateFlavor<Context> & IServicesFlavor & I18nFlavor & {
	resolveText: (text: string | ((ctx: CallbackContext) => string)) => string;
};
export type SessionContext = BaseContext &
	SessionFlavor<ISessionData> & {
		wizard: {
			next: () => Promise<void>;
			back: () => Promise<void>;
			selectStep: (ctx: CallbackContext, stepIndex: number) => Promise<void>;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			state: Record<string, any>;
		};
		scene: {
			leave: () => Promise<void>;
			backToMenu: (ctx: CallbackContext, text: string, menuName: string) => Promise<void>;
			backToUtilitiesMenu: (ctx: CallbackContext, text: string) => Promise<void>;
			confirmOrCancel: (ctx: CallbackContext, text: string) => Promise<void>;
			cancelCreating: (ctx: CallbackContext, menuName?: string) => Promise<void>;
			cancelDeleting: (ctx: CallbackContext, menuName?: string) => Promise<void>;
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
export interface IMenuButton {
	text: string | ((ctx: CallbackContext) => string);
	nextMenu?: string;
	callback: string; // для inline кнопок
	action?: (ctx: CallbackContext) => void;
}

/**
 * Структура меню
 */
export interface IMenu {
	id: string;
	title: string | ((ctx: CallbackContext) => string);
	buttons: IMenuButton[];
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

export interface IResourseProps {
	name: string;
	emoji: string;
}

type TResourceRecord = Readonly<Record<string, IResourseProps>>;


/**
 * Возвращает имя и эмодзи типа ресурса
 */
export const EResource: TResourceRecord = {
	electricity: {
		name: "electricity",
		emoji: "⚡️",
	},
	water: {
		name: "water",
		emoji: "💧",
	},
	gas: {
		name: "gas",
		emoji: "🔥",
	},
} as const;

export type TResource = typeof EResource[keyof typeof EResource];
export type TResourceType = keyof typeof EResource;


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
// 🔌 Типы API и данных от сервиса
// ============================================================

/**
 * Статус заказа от SalesDrive API
 */
export interface StatusInfo {
	name: string;
	type: 1 | 2 | 3 | 4; // 1 - новый, 2 - в работе, 3 - завершён, 4 - удалён
}

export interface StatusData {
	id: number;
	name: string;
	type: 1 | 2 | 3 | 4;
}

export type StatusesMap = Record<string, StatusInfo>;

export type Provider = "novaposhta" | "ukrposhta" | "meest" | "rozetka";

export interface Ord_delivery_data {
	senderId: number;
	cityName: string;
	provider: Provider;
	type: "WarehouseWarehouse" | "WarehouseAddress";
	parentTrackingNumber: string | null;
	trackingNumber: string;
	isPrinted: 1 | 0;
	statusCode: number;
	areaName: string;
	regionName: string;
	cityType: "с." | "м." | "смт.";
	hasPostpay: 1 | 0;
	postpaySum: number;
	branchNumber: string;
	address: string;
	paumentMethod: "Cash" | "Card";
	postpayPayer: string;
	cargoType: "Cargo" | "Parcel";
	addedToRegister: 1 | 0;
}

export interface Contact {
	id: number;
	formId: number;
	active: 1 | 0;
	phone: [string];
	lName: string;
	fName: string;
	email: [string];
	comment: string;
	leadsCount: number;
	company: string;
	con_eDRPOU: string | null;
	leadsSalesCount: number;
	leadsSalesAmount: number;
	createTime: string;
}

export interface Product {
	amount: number;
	productId: number;
	price: number;
	stockId: number;
	costPrice: number;
	discount: number;
	description: string;
	percentDiscount: number;
	text: string;
	barcode: string;
	documentName: string;
	manufacturer: string;
	sku: string;
}

/**
 * Заказ с привязкой к статусу
 */
export interface OrderItem {
	formId: number;
	ord_delivery_data: Ord_delivery_data[];
	primaryContact: Contact;
	contacts: Contact[];
	products: Product[];
	gurt: 1 | 0 | null;
	nePeredzvonuvati: 1 | 0 | null;
	vidsotokVikupuZamovlen: number | null;
	organizationId: number | null;
	statusOplati_2: number | null;
	shippingMethod: number | null;
	paymentMethod: number | null;
	shippingAddress: string | null;
	comment: string;
	sajt: number | null;
	externalId: string | null;
	dzereloZamovlenna: number | null;
	orderTime: string;
	statusId: number;
	typeId: number;
	userId: number;
	updateAt: string;
	paymentAmount: number;
	expensesAmount: number;
	profitAmount: number;
	payedAmount: number | null;
	restPay: number | null;
	timeEntryOrder: string;
	discountAmount: number;
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
 * Опции для функции getToken (Azure)
 */
export interface TokenOptions {
	scopes: string[];
	clientId: string;
	clientSecret: string;
	tenantId: string;
}

/**
 * Результат чтения Excel файла
 */
export interface ExcelReadResult {
	sheets: string[];
	data: Record<string, unknown[][]>;
}

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
