import { Bot, session, MemorySessionStorage } from "grammy";
import { I18n } from "@grammyjs/i18n";
import { User } from "@models/index.js";
import type {
	StatusesMap,
	StatusData,
	ISessionData,
	SessionContext,
	CallbackContext,
} from "@app-types/index.js";
import { CommandManager, MenuManager, SceneManager } from "@managers/index.js";
import { MenuHandler, SceneHandler, EventHandler, createCommandHandler } from "@handlers/index.js";
import * as utils from "@core/util.js";
import { ActionRouter } from "@core/actionRouter.js";
import axios from "axios";
import { writeFileSync, readFileSync } from "fs";
import { hydrate } from "@grammyjs/hydrate";
import path from "path";
import type { Message } from "grammy/types";
/**
 * @class BotClient
 * @extends Bot
 * @description Основной класс бота, который расширяет стандартный клиент grammY.
 * Отвечает за инициализацию всех модулей, обработчиков и сессий.
 */
export default class BotClient extends Bot<SessionContext> {
	// Типизированные свойства класса
	public commandManager: CommandManager;
	public eventHandler: EventHandler;
	public menuManager: MenuManager;
	public menuHandler: MenuHandler;
	public sceneHandler: SceneHandler;
	public sceneManager: SceneManager;
	public router: ActionRouter<CallbackContext>;
	public utils: typeof utils;
	public statuses: StatusesMap = {};
	public startTime: Date;
	public sessionStorage: MemorySessionStorage<ISessionData>;
	public sceneTimers: Map<number, ReturnType<typeof setTimeout>>;
	public i18n: I18n<SessionContext>;

	// API ключ для SalesDrive
	private readonly SALESDRIVES_API_KEY =
		"Yf_G5DDHhu58CXp5c0fGx_aHH4TJRjlIDO0QIqpehYWx5QN2iOkjc5kEtOk5hpUKUvKa9UAPXf7JwnA1FyVjEmlM4cWdTRsniH1l";
	private readonly SALESDRIVES_BASE_URL = "https://kompikok.salesdrive.me/api";
	private readonly SALESDRIVES_ORDER_LIST_URL = `${this.SALESDRIVES_BASE_URL}/order/list/`;
	private readonly SALESDRIVES_STATUS_LIST_URL = `${this.SALESDRIVES_BASE_URL}/statuses/`;

	/**
	 * @constructor
	 * @param {string} token - Токен Telegram-бота.
	 */
	constructor(token: string) {
		super(token);
		this.startTime = new Date();
		this.utils = utils;
		this.sceneManager = new SceneManager();
		this.sceneHandler = new SceneHandler(this);
		this.commandManager = new CommandManager(this);
		this.eventHandler = new EventHandler(this);
		this.menuManager = new MenuManager(this);
		this.menuHandler = new MenuHandler(this, this.menuManager);
		this.router = new ActionRouter(this);
		this.sessionStorage = new MemorySessionStorage();
		this.sceneTimers = new Map();
		this.i18n = new I18n<SessionContext>({
			defaultLocale: "ru",
			directory: path.resolve(process.cwd(), "locales"),
			useSession: true,
			localeNegotiator: async (ctx) => {
				if (ctx.session?.language) return ctx.session.language;

				if (ctx.from?.id) {
					const user = await User.findOne({ telegram_id: ctx.from.id });
					if (user?.language) {
						ctx.session.language = user.language; // кэшируем в сессию
						return user.language;
					}
				}

				const telegramLang = ctx.from?.language_code;
				const lang = telegramLang === "uk" ? "ua" : telegramLang || "ru";
				if (ctx.session) ctx.session.language = lang;
				return lang;
			},
		});
	}

	/**
	 * Инициализирует все компоненты бота.
	 * Загружает команды, меню, сцены, настраивает middleware.
	 * @returns {Promise<void>}
	 */
	async initialize(): Promise<void> {
		try {
			this.use(hydrate());
			this.use(
				session({
					initial: (): ISessionData => ({
						currentScene: null,
						step: 0,
						wizardState: {},
						menuStack: [],
						currentMenuId: "utilities-menu",
					}),
					storage: this.sessionStorage,
				}),
			);
			this.use(this.i18n);
			this.use((ctx, next) => {
				ctx.resolveText = (text) => {
					return typeof text === "function" ? text(ctx as CallbackContext) : text;
				};
				((ctx.services = {
					sceneHandler: this.sceneHandler,
					sceneManager: this.sceneManager,
					commandManager: this.commandManager,
					menuManager: this.menuManager,
				}),
					(ctx.utils = this.utils));
				return next();
			});
			this.use(async (ctx: SessionContext, next) => {
				ctx.wizard = {
					next: async () => await this.sceneManager.next(ctx as CallbackContext),
					back: async () => await this.sceneManager.back(ctx as CallbackContext),
					selectStep: async (ctx, stepIndex) =>
						await this.sceneManager.selectStep(ctx, stepIndex),
					state: ctx.session.wizardState ?? (ctx.session.wizardState = {})
				};
				ctx.scene = {
					leave: async () => await this.sceneManager.leave(ctx as CallbackContext),
					backToMenu: async (ctx, text, menuName) => await this.sceneManager.backToMenu(ctx, text, menuName),
					backToUtilitiesMenu: async (ctx, text) => await this.sceneManager.backToUtilitiesMenu(ctx, text),
					confirmOrCancel: async (ctx, text) => await this.sceneManager.confirmOrCancel(ctx, text),
					cancelCreating: async (ctx, menuName) => await this.sceneManager.cancleCreating(ctx, menuName),
					cancelDeleting: async (ctx, menuName) => await this.sceneManager.cancelDeleting(ctx, menuName)
				};
				await next();
			});

			this.use(async (ctx, next) => {
				// 1. Очищаем старый таймер при любой активности пользователя в чате
				if (ctx.chat?.id && this.sceneTimers.has(ctx.chat.id)) {
					clearTimeout(this.sceneTimers.get(ctx.chat.id));
					this.sceneTimers.delete(ctx.chat.id);
				}

				if (ctx.session.currentScene) await this.sceneManager.handle(ctx as CallbackContext);
				else await next();

				// 2. Если после обработки пользователь находится в сцене, запускаем таймер
				if (ctx.chat?.id && ctx.session.currentScene) {
					let chatId = ctx.chat.id;
					let messageId: number | undefined;

					// Пытаемся найти ID сообщения интерфейса для удаления
					if (ctx.callbackQuery?.message?.message_id) {
						messageId = ctx.callbackQuery.message.message_id;
						chatId = ctx.callbackQuery.message.chat.id;
					} else if (ctx.update.message?.message_id) {
						messageId = ctx.update.message.message_id;
						chatId = ctx.update.message.chat.id;
					} else {
						const state = ctx.session.wizardState;
						const msg = state?.message as Message | undefined;
						if (msg?.message_id) messageId = msg.message_id;
					}

					const timer = setTimeout(() =>
						this.handleSceneTimeout(chatId, messageId),
						60000,
					);
					this.sceneTimers.set(chatId, timer);
				}
			});

			this.menuHandler.init();

			await this.commandManager.loadCommands();
			await this.sceneHandler.loadScenes();
			const loadedMenus = await this.menuManager.loadMenus();
			loadedMenus.forEach((menu) => this.menuHandler.registerMenuHandlers(menu));

			this.router.register("create-account", async (ctx, addressId) => {
				ctx.wizard.state.addressId = addressId;
				await this.sceneManager.enter(ctx, "create-account");
			});

			this.router.register("delete-account", async (ctx, accountId) => {
				ctx.wizard.state.accountId = accountId;
				await this.sceneManager.enter(ctx, "delete-account");
			});

			this.router.register("delete-address", async (ctx, addressId) => {
				ctx.wizard.state.addressId = addressId;
				await this.sceneManager.enter(ctx, "delete-address");
			});

			this.router.register("create-reading", async (ctx, accountId) => {
				ctx.wizard.state.accountId = accountId;
				await this.sceneManager.enter(ctx, "create-reading");
			});

			this.router.register("delete-reading", async (ctx, readingId) => {
				ctx.wizard.state.readingId = readingId;
				await this.sceneManager.enter(ctx, "delete-reading");
			});

			this.router.register("create-tariff", async (ctx, accountId) => {
				ctx.wizard.state.accountId = accountId;
				await this.sceneManager.enter(ctx, "create-tariff");
			});

			this.router.register("delete-tariff", async (ctx, tariffId) => {
				ctx.wizard.state.tariffId = tariffId;
				await this.sceneManager.enter(ctx, "delete-tariff");
			});

			this.router.register("calculate-bill", async (ctx, accountId) => {
				ctx.wizard.state.accountId = accountId;
				await this.sceneManager.enter(ctx, "calculate-bill");
			});

			this.on("callback_query:data", async (ctx) => {
				// Этот слушатель срабатывает последним, если MenuHandler не обработал кнопку.
				// Пытаемся передать управление роутеру.
				await this.router.handle(ctx as CallbackContext);
				return ctx.answerCallbackQuery().catch(() => { });
			});

			await this.commandManager.registerBotCommands();
			this.use(createCommandHandler(this));

			// Загружаем данные от SalesDrive API
			await this.loadSalesdriveStatuses();
		} catch (err) {
			console.error("❌ Initialization error:", err);
			throw err;
		}
	}

	/**
	 * Обработчик таймаута сцены: удаляет сообщение и сбрасывает состояние
	 */
	private async handleSceneTimeout(chatId: number, messageId?: number): Promise<void> {
		try {
			const key = chatId.toString();
			const session = this.sessionStorage.read(key);

			if (session && session.currentScene) {
				// Удаляем сообщение с кнопками, если ID известен
				if (messageId) {
					try {
						await this.api.deleteMessage(chatId, messageId);
					} catch (e) {
						/* Сообщение уже удалено или ошибка доступа */
					}
				}

				// Сбрасываем состояние сцены
				console.log(`Scene timeout: ${session.currentScene}`);
				session.currentScene = null;
				session.step = 0;
				session.wizardState = {};

				this.sessionStorage.write(key, session);
			}
		} catch (error) {
			console.error(`[Timeout] Error handling scene timeout for chat ${chatId}:`, error);
		}
		this.sceneTimers.delete(chatId);
	}

	/**
	 * Загрузка статусов с SalesDrive
	 * Типы помогают избежать ошибок при работе с данными
	 */
	private async loadSalesdriveStatuses(): Promise<void> {
		try {
			// 1. Сначала пробуем загрузить из локального кэша (файла)
			try {
				const cached = readFileSync("statuses.json", "utf8");
				this.statuses = JSON.parse(cached);
			} catch (e) {
				/* Файла нет или ошибка чтения — не страшно */
			}

			const statusResponse = await axios(this.SALESDRIVES_STATUS_LIST_URL, {
				headers: { "X-Api-Key": this.SALESDRIVES_API_KEY },
			});

			if (statusResponse.data.success && Array.isArray(statusResponse.data.data)) {
				const newStatuses: StatusesMap = {};
				// Преобразуем данные в удобный формат
				statusResponse.data.data.forEach((item: StatusData) => {
					newStatuses[item.id] = {
						name: item.name,
						type: item.type,
					};
				});

				// Обновляем кэш в памяти и на диске
				this.statuses = newStatuses;
				// Сохраняем в файл
				writeFileSync("statuses.json", JSON.stringify(this.statuses, null, 2), "utf8");
			}

		} catch (err) {
			console.error(
				"❌ Error loading statuses from SalesDrive:",
				err instanceof Error ? err.stack : err,
			);
		}
	}

	/**
	 * Запуск бота
	 * Promise<void> - асинхронный метод, не возвращающий ничего
	 */
	async launchBot(): Promise<void> {
		try {
			console.log("🚀 Bot started...");
			await this.start();
		} catch (err) {
			console.error("❌ Error starting bot: ", err instanceof Error ? err.message : err);
			console.error("Full error:", err);
		}
	}

	/**
	 * Остановка бота
	 * signal: string - тип сигнала (SIGINT, SIGTERM)
	 */
	stopBot(signal: string): void {
		console.log(`⏹️ Bot stopped with signal: ${signal}`);
		// Используем родительский метод Telegraf
		super.stop();
	}
}
