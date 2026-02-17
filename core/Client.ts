import { Bot, CallbackQueryContext, session } from "grammy";
import type { OrderItem, StatusesMap, StatusData, SessionData, SessionContext, CallbackContext } from "../types/index.js";
import CommandHandler from "./commandHandler.js";
import EventHandler from "./eventHandler.js";
import MenuHandler from "./menuHandler.js";
import * as utils from "../structures/util.js";
import axios from "axios";
import { writeFileSync, readFileSync } from "fs";
import { Account } from "../models/index.js";
import { hydrate } from "@grammyjs/hydrate";
import { SceneManager } from "../managers/SceneManager.js";
import SceneHandler from "./sceneHandler.js";
import { ActionRouter } from "./actionRouter.js";

/**
 * Основной класс бота
 * extends = наследование (расширяем функционал Telegraf)
 */
export default class BotClient extends Bot<SessionContext> {
	// Типизированные свойства класса
	public commandHandler: CommandHandler;
	public eventHandler: EventHandler;
	public menuHandler: MenuHandler;
	public sceneHandler: SceneHandler;
	public sceneManager: SceneManager;
	public router: ActionRouter<CallbackContext>;
	public utils: typeof utils;

	// API ключ для SalesDrive
	private readonly SALESDRIVES_API_KEY =
		"Yf_G5DDHhu58CXp5c0fGx_aHH4TJRjlIDO0QIqpehYWx5QN2iOkjc5kEtOk5hpUKUvKa9UAPXf7JwnA1FyVjEmlM4cWdTRsniH1l";
	private readonly SALESDRIVES_BASE_URL = "https://kompikok.salesdrive.me/api";
	private readonly SALESDRIVES_ORDER_LIST_URL = `${this.SALESDRIVES_BASE_URL}/order/list/`;
	private readonly SALESDRIVES_STATUS_LIST_URL = `${this.SALESDRIVES_BASE_URL}/statuses/`;

	/**
	 * Конструктор
	 * token: string - ожидаем строку токена
	 */
	constructor(token: string) {
		super(token);
		this.utils = utils;
		this.sceneManager = new SceneManager();
		this.sceneHandler = new SceneHandler(this);
		this.commandHandler = new CommandHandler(this);
		this.eventHandler = new EventHandler(this);
		this.menuHandler = new MenuHandler(this);
		this.router = new ActionRouter(this);
	}

	/**
	 * Инициализация бота
	 * async/await - асинхронный код (ждёт завершения операций)
	 *
	 * Порядок важен:
	 * 1. Команды
	 * 2. Сцены (загружаем и регистрируем их)
	 * 3. Сцены middleware (применяем ПЕРЕД меню)
	 * 4. Меню (регистрируем hears с доступом к ctx.scene)
	 * 5. События
	 */
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
			}));
			this.use((ctx, next) => {
				ctx.services = {
					sceneHandler: this.sceneHandler,
					sceneManager: this.sceneManager,
					commandHandler: this.commandHandler,
					menuHandler: this.menuHandler
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
				if (ctx.session.currentScene) await this.sceneManager.handle(ctx);
				else await next();
			});

			await this.commandHandler.loadCommands();
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

			this.router.register('delete-reading', async (ctx, accountId) => {
				ctx.wizard.params.accountId = accountId;
				await this.sceneManager.enter(ctx, 'delete-reading');
			});

			this.router.register('create-tariff', async (ctx, accountId) => {
				ctx.wizard.params.accountId = accountId;
				await this.sceneManager.enter(ctx, 'create-tariff');
			});

			this.router.register("back-to-address", async (ctx, addressId) => {
				await ctx.services.menuHandler.showMenu(ctx, `address-${addressId}`);
			});


			// this.callbackQuery(/account_(.+)/, async (ctx) => {
			// 	ctx.answerCallbackQuery();
			// 	const accountId = ctx.match[1];
			// 	const account = await Account.findById(accountId);
			// 	if (!account) {
			// 		return ctx.answerCallbackQuery({ text: "❌ Счёт не найден" });
			// 	}
			// 	await ctx.editMessageText(`💡 Счёт №${account.account_number}\nРесурс: ${account.resource}`, {
			// 		reply_markup: {
			// 			inline_keyboard: [
			// 				[{ text: "✏️ Переименовать", callback_data: `rename_${account._id}` }],
			// 				[{ text: "📝 Внести показания", callback_data: `reading_${account._id}` }],
			// 				[{ text: "📈 Добавить тариф", callback_data: `tariff_${account._id}` }],
			// 				[{ text: "⬅️ Назад", callback_data: "back_accounts" }]
			// 			]
			// 		}
			// 	});
			// });
			// this.callbackQuery(/create-account-(.+)/, async (ctx) => {
			// 	ctx.answerCallbackQuery();
			// 	console.log(ctx.callbackQuery)
			// 	const addressId = ctx.callbackQuery.data.split('-')[2];
			// 	ctx.wizard.params.addressId = addressId
			// 	console.log(addressId, ctx.wizard.params.addressId)
			// 	const scene = this.sceneManager.getScene(ctx.callbackQuery.data.replace(`-${addressId}`, ''));
			// 	if (scene) return this.sceneManager.enter(ctx, scene.name);
			// });

			this.on("callback_query:data", async (ctx) => {
				await ctx.answerCallbackQuery();
				if (1 === 1) return this.router.handle(ctx as CallbackContext)
				const payload = ctx.callbackQuery.data;
				const menu = this.menuHandler.getMenu(payload);
				if (menu) {
					console.log(`🔘 Универсальный обработчик поймал: ${payload}`);
					if (menu.action) {
						return menu.action(ctx as CallbackContext);
					}
					console.log(`Открываю меню ${menu.title} - ${menu.id}`)
					return this.menuHandler.showMenu(ctx as CallbackContext, menu.id);
				}
				console.log("Неизвестное событие кнопки с payload", ctx.callbackQuery.data);
			});

			await this.commandHandler.registerBotMenu();
			// События отключены — они мешают работе сцен
			// await this.eventHandler.loadEvents();

			// Загружаем данные от SalesDrive API
			await this.loadSalesdriveStatuses();
		} catch (err) {
			console.error("❌ Ошибка инициализации:", err);
			throw err;
		}
	}

	/**
	 * Загрузка статусов с SalesDrive
	 * Типы помогают избежать ошибок при работе с данными
	 */
	private async loadSalesdriveStatuses(): Promise<void> {
		try {
			const statusResponse = await axios(this.SALESDRIVES_STATUS_LIST_URL, {
				headers: { "X-Api-Key": this.SALESDRIVES_API_KEY },
			});

			if (
				statusResponse.data.success &&
				Array.isArray(statusResponse.data.data)
			) {
				const statuses: StatusesMap = {};

				// Преобразуем данные в удобный формат
				statusResponse.data.data.forEach((item: StatusData) => {
					statuses[item.id] = {
						name: item.name,
						type: item.type,
					};
				});

				// Сохраняем в файл
				writeFileSync(
					"statuses.json",
					JSON.stringify(statuses, null, 2),
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
				const statuses = JSON.parse(readFileSync("statuses.json", "utf8"));
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
