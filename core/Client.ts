import { Bot, session, MemorySessionStorage } from "grammy";
import type { OrderItem, StatusesMap, StatusData, SessionData, SessionContext, CallbackContext } from "../types/index.js";
import CommandManager from "./CommandManager.js";
import { createCommandHandler } from "./commandHandler.js";
import EventHandler from "./eventHandler.js";
import MenuHandler from "./menuHandler.js";
import * as utils from "../structures/util.js";
import axios from "axios";
import { writeFileSync, readFileSync } from "fs";
import { hydrate } from "@grammyjs/hydrate";
import { SceneManager } from "./SceneManager.js";
import SceneHandler from "./sceneHandler.js";
import { ActionRouter } from "./actionRouter.js";


export default class BotClient extends Bot<SessionContext> {
	// Типизированные свойства класса
	public commandManager: CommandManager;
	public eventHandler: EventHandler;
	public menuHandler: MenuHandler;
	public sceneHandler: SceneHandler;
	public sceneManager: SceneManager;
	public router: ActionRouter<CallbackContext>;
	public utils: typeof utils;
	public statuses: StatusesMap = {};
	public startTime: Date;
	public sessionStorage: MemorySessionStorage<SessionData>;
	public sceneTimers: Map<number, ReturnType<typeof setTimeout>>;

	// API ключ для SalesDrive
	private readonly SALESDRIVES_API_KEY =
		"Yf_G5DDHhu58CXp5c0fGx_aHH4TJRjlIDO0QIqpehYWx5QN2iOkjc5kEtOk5hpUKUvKa9UAPXf7JwnA1FyVjEmlM4cWdTRsniH1l";
	private readonly SALESDRIVES_BASE_URL = "https://kompikok.salesdrive.me/api";
	private readonly SALESDRIVES_ORDER_LIST_URL = `${this.SALESDRIVES_BASE_URL}/order/list/`;
	private readonly SALESDRIVES_STATUS_LIST_URL = `${this.SALESDRIVES_BASE_URL}/statuses/`;

	constructor(token: string) {
		super(token);
		this.startTime = new Date();
		this.utils = utils;
		this.sceneManager = new SceneManager();
		this.sceneHandler = new SceneHandler(this);
		this.commandManager = new CommandManager(this);
		this.eventHandler = new EventHandler(this);
		this.menuHandler = new MenuHandler(this);
		this.router = new ActionRouter(this);
		this.sessionStorage = new MemorySessionStorage();
		this.sceneTimers = new Map();
	}

	async initialize(): Promise<void> {
		try {
			this.use(hydrate());
			this.use(session({
				initial: (): SessionData => ({
					currentScene: null,
					step: 0,
					wizardState: {},
					params: {},
				}),
				storage: this.sessionStorage,
			}));
			this.use((ctx, next) => {
				ctx.services = {
					sceneHandler: this.sceneHandler,
					sceneManager: this.sceneManager,
					commandManager: this.commandManager,
					menuHandler: this.menuHandler,
				},
					ctx.utils = this.utils
				return next();
			});
			this.use(async (ctx: SessionContext, next) => {
				ctx.wizard = {
					next: async () => await this.sceneManager.next(ctx),
					back: async () => await this.sceneManager.back(ctx),
					selectStep: async (ctx, stepIndex) => await this.sceneManager.selectStep(ctx, stepIndex),
					state: ctx.session.wizardState ?? (ctx.session.wizardState = {}),
					params: ctx.session.params ?? (ctx.session.params = {})
				}
				ctx.scene = {
					leave: async () => await this.sceneManager.leave(ctx),
				};
				await next();
			});

			this.use(async (ctx, next) => {
				// 1. Очищаем старый таймер при любой активности пользователя в чате
				if (ctx.chat?.id && this.sceneTimers.has(ctx.chat.id)) {
					clearTimeout(this.sceneTimers.get(ctx.chat.id));
					this.sceneTimers.delete(ctx.chat.id);
				}

				if (ctx.session.currentScene) await this.sceneManager.handle(ctx);
				else await next();

				// 2. Если после обработки пользователь находится в сцене, запускаем таймер
				if (ctx.chat?.id && ctx.session.currentScene) {
					const chatId = ctx.chat.id;
					let messageId: number | undefined;

					// Пытаемся найти ID сообщения интерфейса для удаления
					if (ctx.callbackQuery?.message?.message_id) {
						messageId = ctx.callbackQuery.message.message_id;
					} else {
						// Проверяем, сохранено ли сообщение в состоянии сцены
						const state = ctx.session.wizardState as any;
						const params = ctx.session.params as any;
						if (state?.message?.message_id) messageId = state.message.message_id;
						else if (params?.message?.message_id) messageId = params.message.message_id;
					}

					const timer = setTimeout(() => this.handleSceneTimeout(chatId, messageId), 60000);
					this.sceneTimers.set(chatId, timer);
				}
			});

			await this.commandManager.loadCommands();
			await this.menuHandler.loadMenus();
			await this.sceneHandler.loadScenes();

			this.router.register('create-account', async (ctx, addressId) => {
				ctx.wizard.params.addressId = addressId;
				await this.sceneManager.enter(ctx, 'create-account');
			});

			this.router.register('delete-account', async (ctx, accountId) => {
				ctx.wizard.params.accountId = accountId;
				await this.sceneManager.enter(ctx, 'delete-account')
			});

			this.router.register('delete-address', async (ctx, addressId) => {
				ctx.wizard.params.addressId = addressId;
				await this.sceneManager.enter(ctx, 'delete-address')
			});

			this.router.register('create-reading', async (ctx, accountId) => {
				ctx.wizard.params.accountId = accountId;
				await this.sceneManager.enter(ctx, 'create-reading');
			});

			this.router.register('delete-reading', async (ctx, readingId) => {
				ctx.wizard.params.readingId = readingId;
				await this.sceneManager.enter(ctx, 'delete-reading');
			});

			this.router.register('create-tariff', async (ctx, accountId) => {
				ctx.wizard.params.accountId = accountId;
				await this.sceneManager.enter(ctx, 'create-tariff');
			});

			this.router.register("back-to-address", async (ctx, addressId) => {
				await ctx.services.menuHandler.showMenu(ctx, `address-${addressId}`);
			});

			this.router.register("back-to-account", async (ctx, accountId) => {
				await ctx.services.menuHandler.showMenu(ctx, `address-${accountId}`);
			});

			this.on("callback_query:data", async (ctx) => {
				// Этот слушатель срабатывает последним, если MenuHandler не обработал кнопку.
				// Пытаемся передать управление роутеру.
				await this.router.handle(ctx as CallbackContext);
				return ctx.answerCallbackQuery().catch(() => {});
			});

			await this.commandManager.registerBotCommands();
			this.use(createCommandHandler(this));

			// Загружаем данные от SalesDrive API
			await this.loadSalesdriveStatuses();
		} catch (err) {
			console.error("❌ Ошибка инициализации:", err);
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
					} catch (e) { /* Сообщение уже удалено или ошибка доступа */ }
				}

				// Сбрасываем состояние сцены
				session.currentScene = null;
				session.step = 0;
				session.wizardState = {};
				session.params = {};
				console.log(`Сцена остановлена: ${session.currentScene}`)

				this.sessionStorage.write(key, session);
			}
		} catch (error) {
			console.error(`[Timeout] Ошибка обработки таймаута для чата ${chatId}:`, error);
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
			} catch (e) { /* Файла нет или ошибка чтения — не страшно */ }

			const statusResponse = await axios(this.SALESDRIVES_STATUS_LIST_URL, {
				headers: { "X-Api-Key": this.SALESDRIVES_API_KEY },
			});

			if (
				statusResponse.data.success &&
				Array.isArray(statusResponse.data.data)
			) {
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
				writeFileSync(
					"statuses.json",
					JSON.stringify(this.statuses, null, 2),
					"utf8",
				);
			}

			// Запрашиваем список заказов
			const ordersResponse = await axios(this.SALESDRIVES_ORDER_LIST_URL, {
				headers: { "X-Api-Key": this.SALESDRIVES_API_KEY },
			});

			if (
				ordersResponse.data.status === "success" &&
				Array.isArray(ordersResponse.data.data)
			) {
				const firstOrder: OrderItem = ordersResponse.data.data[0];
			}
		} catch (err) {
			console.error(
				"❌ Ошибка при получении данных SalesDrive:",
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
			console.log("🚀 Бот запущен");
			await this.start();
		} catch (err) {
			console.error(
				"❌ Ошибка запуска бота:",
				err instanceof Error ? err.message : err,
			);
			console.error("Полная ошибка:", err);
		}
	}

	/**
	 * Остановка бота
	 * signal: string - тип сигнала (SIGINT, SIGTERM)
	 */
	stopBot(signal: string): void {
		console.log(`⏹️ Бот остановлен сигналом: ${signal}`);
		// Используем родительский метод Telegraf
		super.stop();
	}
}
