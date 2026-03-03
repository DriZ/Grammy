import { Bot, session, MemorySessionStorage } from "grammy";
import { I18n } from "@grammyjs/i18n";
import { User } from "@models/index.js";
import type {
  ISessionData,
  SessionContext,
  CallbackContext,
  SceneRoutesData,
} from "@app-types/index.js";
import { CommandManager, MenuManager, SceneManager } from "@managers/index.js";
import { MenuHandler, EventHandler, createCommandHandler } from "@handlers/index.js";
import * as utils from "@core/util.js";
import { ReminderService, JoinService } from "@core/services/index.js";
import { ActionRouter } from "@core/actionRouter.js";
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
  public sceneManager: SceneManager;
  public reminderService: ReminderService;
  public joinService: JoinService;
  public router: ActionRouter<CallbackContext>;
  public utils: typeof utils;
  public startTime: Date;
  public sessionStorage: MemorySessionStorage<ISessionData>;
  public sceneTimers: Map<number, ReturnType<typeof setTimeout>>;
  public i18n: I18n<SessionContext>;

  /**
   * @constructor
   * @param {string} token - Токен Telegram-бота из BotFather.
   */
  constructor(token: string) {
    super(token);
    this.startTime = new Date();
    this.utils = utils;
    this.sceneManager = new SceneManager(this);
    this.commandManager = new CommandManager(this);
    this.eventHandler = new EventHandler(this);
    this.menuManager = new MenuManager(this);
    this.menuHandler = new MenuHandler(this, this.menuManager);
    this.reminderService = new ReminderService(this);
    this.router = new ActionRouter(this);
    this.joinService = new JoinService(this);
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
            currentMenuId: "main-menu",
          }),
          storage: this.sessionStorage,
        }),
      );
      this.use(this.i18n);
      this.use((ctx, next) => {
        ctx.resolveText = async (text) => {
          return typeof text === "function" ? await text(ctx as CallbackContext) : text;
        };
        ((ctx.services = {
          sceneManager: this.sceneManager,
          commandManager: this.commandManager,
          menuManager: this.menuManager,
        }),
          (ctx.escapeHTML = this.utils.escapeHTML));
        return next();
      });
      this.use(async (ctx: SessionContext, next) => {
        ctx.wizard = {
          next: async () => await this.sceneManager.next(ctx as CallbackContext),
          back: async () => await this.sceneManager.back(ctx as CallbackContext),
          selectStep: async (ctx, stepIndex) =>
            await this.sceneManager.selectStep(ctx, stepIndex),
          state: ctx.session.wizardState ??= {}
        };
        ctx.scene = {
          leave: async () => await this.sceneManager.leave(ctx as CallbackContext),
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
            300000, // 5 минут
          );
          this.sceneTimers.set(chatId, timer);
        }
      });

      this.menuHandler.init();
      this.reminderService.init();

      await this.commandManager.loadCommands();
      await this.sceneManager.loadScenes();
      const loadedMenus = await this.menuManager.loadMenus();
      loadedMenus.forEach((menu) => this.menuHandler.registerMenuHandlers(menu));

      this.router.register("calculate-bill-by-address", async (ctx, addressId) => {
        ctx.wizard.state.addressId = addressId as string;
        await this.sceneManager.enter(ctx, "calculate-bill");
      });


      // Регистрация роутов, которые запускают сцены.
      const sceneRoutes: SceneRoutesData[] = [
        { prefix: "calculate-bill", stateKeys: ["accountId"] }, // calculate-bill-accountId
        { prefix: "change-currency", stateKeys: ["accountId"] },// change-currency-accountId
        { prefix: "change-unit", stateKeys: ["accountId"] },    // change-unit-accountId
        { prefix: "create-account", stateKeys: ["addressId"] }, // create-account-addressId
        { prefix: "create-address", stateKeys: [] },            // create-address
        { prefix: "create-fixedfee", stateKeys: ["accountId"] },// create-fixedfee-accountId
        { prefix: "create-reading", stateKeys: ["accountId"] }, // create-reading-accountId
        { prefix: "create-reminder", stateKeys: [] },           // create-reminder
        { prefix: "create-tariff", stateKeys: ["accountId"] },  // create-tariff-accountId
        { prefix: "delete-account", stateKeys: ["accountId"] }, // delete-account-accountId
        { prefix: "delete-address", stateKeys: ["addressId"] }, // delete-address-addressId
        { prefix: "delete-fixedfee", stateKeys: ["fixedFeeId"] },// delete-fixedfee-fixedFeeId
        { prefix: "delete-reading", stateKeys: ["readingId"] }, // delete-reading-readingId
        { prefix: "delete-reminder", stateKeys: ["reminderId"] }, // delete-reminder-remonderId
        { prefix: "delete-tariff", stateKeys: ["tariffId"] }, // delete-tariff-tariffId
        { prefix: "kick-user", stateKeys: ["addressId", "targetUserId"] }, // kick-user-addrId-usrId
        { prefix: "set-timezone", stateKeys: [] }, // set-timezone
        { prefix: "transfer-address", stateKeys: ["addressId", "targetUserId"] }, // transfer-address-addrId-usrId
      ];

      sceneRoutes.forEach(({ prefix, stateKeys }) => {
        this.router.register(prefix, async (ctx, ...args) => {
          args.forEach((arg, index) => {
            if (index < stateKeys.length) {
              const key = stateKeys[index];
              let value: string | number = arg;
              // Преобразуем в число, если ключ этого требует
              if (key === 'targetUserId') {
                value = parseInt(arg, 10);
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (ctx.wizard.state as any)[key] = value;
            }
          });
          await this.sceneManager.enter(ctx, prefix);
        });
      });

      this.router.register("join-approve", (ctx, ...args) => this.joinService.approveRequest(ctx, args[0], args[1]));
      this.router.register("join-reject", (ctx, ...args) => this.joinService.rejectRequest(ctx, args[0], args[1]));

      this.on("callback_query:data", async (ctx) => {
        // Этот слушатель срабатывает последним, если MenuHandler не обработал кнопку.
        // Пытаемся передать управление роутеру.
        await this.router.handle(ctx as CallbackContext);
        return ctx.answerCallbackQuery().catch(() => { });
      });

      await this.commandManager.registerBotCommands();
      this.use(createCommandHandler(this));

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
