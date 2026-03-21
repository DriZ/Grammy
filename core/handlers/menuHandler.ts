/* eslint-disable no-case-declarations */
/**
 * menuHandler.ts - Обработчик меню/кнопок
 * 
 * Управляет обработкой событий и отображением интерактивных меню
 */

import type { CallbackContext, MenuBase, MenuButton } from "@app-types/index.js";
import type BotClient from "@core/Client.js";
import { Account, Address, Tariff, UtilitiesReading, FixedFee, UserAddress, User, Reminder } from "@models/index.js";
import { AccountMenu } from "@menus/accountMenus.js";
import { AddressMenu, AddressUsersMenu, AddressUserMenu } from "@menus/addressMenus.js";
import { ReadingsMenu, ReadingMenu } from "@menus/readingMenus.js";
import { TariffMenu, TariffsMenu } from "@menus/tariffMenus.js";
import { FixedFeesMenu, FixedFeeMenu } from "@menus/fixedFeeMenus.js";
import { RemindersMenu, ReminderMenu } from "@menus/reminderMenus.js";
import { MenuManager } from "@managers/index.js";

/**
 * Обработчик меню
 */
export class MenuHandler {
  private client: BotClient;
  private menuManager: MenuManager;
  private menuCreators: Map<string, (ctx: CallbackContext, id: string, param?: string) => Promise<MenuBase | undefined>>;

  /**
   * Конструктор
   * @param client - экземпляр BotClient
   */
  constructor(client: BotClient, menuManager: MenuManager) {
    this.client = client;
    this.menuManager = menuManager;

    this.menuCreators = new Map([
      ["address", this._createAddressMenu.bind(this)],
      ["account", this._createAccountMenu.bind(this)],
      ["readings", this._createReadingsMenu.bind(this)],
      ["reading", this._createReadingMenu.bind(this)],
      ["tariffs", this._createTariffsMenu.bind(this)],
      ["tariff", this._createTariffMenu.bind(this)],
      ["fixed-fees", this._createFixedFeesMenu.bind(this)],
      ["fixed-fee", this._createFixedFeeMenu.bind(this)],
      ["address-users", this._createAddressUsersMenu.bind(this)],
      ["address-user", this._createAddressUserMenu.bind(this)],
      ["reminder", this._createReminderMenu.bind(this)],
    ]);
  }

  /**
   * Инициализация слушателей событий
   */
  init() {
    // Обработчик кнопки "Назад"
    this.client.callbackQuery("menu-back", async (ctx) => {
      await ctx.answerCallbackQuery();
      return this.menuManager.goBack(ctx as CallbackContext);
    });

    this.client.callbackQuery("noop", async (ctx) => {
      return ctx.answerCallbackQuery();
    });

    // Настраиваем резолвер для динамических меню
    this.menuManager.dynamicMenuResolver = async (ctx, menuId) => {
      // Обрабатываем специальные случаи, которые не вписываются в общий паттерн
      if (menuId === "reminders-menu" && ctx.from?.id) {
        return new RemindersMenu(this.client, ctx.from.id);
      }

      const match = menuId.match(/^(account|address|reading|readings|tariff|tariffs|fixed-fees|fixed-fee|address-users|address-user|reminder)-([a-fA-F0-9]{24})(?:-(\d+))?$/);
      if (!match) return undefined;

      const [, prefix, id, param] = match;
      const creator = this.menuCreators.get(prefix);

      if (creator) {
        try {
          return await creator(ctx, id, param);
        } catch (error) {
          console.error(`❌ Ошибка при создании меню "${menuId}":`, error);
        }
      }

      return undefined;
    };

    // Регистрируем глобальный обработчик для динамических кнопок команд
    this.client.callbackQuery(/^cmd:(.+)$/, async (ctx: CallbackContext) => {
      const match = ctx.match as RegExpMatchArray;
      // console.log(`Словил кнопку команды: ${match[1]}`);
      const commandName = match[1];
      const command = this.client.commandManager.commands.get(commandName);

      if (command) {
        await ctx.answerCallbackQuery(); // Подтверждаем нажатие

        // Запоминаем ID исходного меню
        const originalMenuId = ctx.session.currentMenuId || 'main-menu';

        // Переопределяем reply, чтобы команда редактировала текущее сообщение
        const originalReply = ctx.reply.bind(ctx);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx as any).reply = async (text: string, extra: any = {}) => {
          try {
            // Команда редактирует сообщение, но БЕЗ кнопки "Назад"
            return await ctx.editMessageText(text, extra);
          } catch (e) {
            // Если редактирование невозможно (например, контент не изменился), отправляем новое
            return await originalReply(text, extra);
          }
        };

        try {
          // Выполняем команду. Она отредактирует исходное сообщение с меню.
          await command.execute(ctx, []);

          // Восстанавливаем оригинальный reply
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ctx as any).reply = originalReply;

          // Теперь отправляем НОВОЕ сообщение с исходным меню
          await this.menuManager.showMenu(ctx, originalMenuId, false, true, true);
        } catch (e) {
          console.error(`Ошибка выполнения команды ${commandName} из меню:`, e);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ctx as any).reply = originalReply; // Восстанавливаем на случай ошибки
          await ctx.reply("❌ Ошибка при выполнении команды.");
        }
      } else {
        await ctx.answerCallbackQuery("⚠️ Команда не найдена или отключена.");
      }
    });

    // Регистрируем глобальный обработчик для навигации по меню
    this.client.on("callback_query:data", async (ctx, next) => {
      const menuId = ctx.callbackQuery.data;

      if (menuId === "commands-list" || menuId === "delete-msg") {
        await ctx.answerCallbackQuery();
        return this.menuManager.showMenu(ctx as CallbackContext, menuId);
      }

      // Проверяем, является ли callback идентификатором меню (статическим или динамическим)
      const isStatic = this.menuManager.menus.has(menuId);
      const isDynamic = /^(readings|address|account|reading|tariff|tariffs|fixed-fees|fixed-fee|address-users|address-user|reminder)-([a-fA-F0-9]{24})(?:-(\d+))?$/.test(menuId);
      const isReminders = menuId === "reminders-menu";

      if (isStatic || isDynamic || isReminders) {
        try {
          await ctx.answerCallbackQuery();

          // Пытаемся найти кнопку в текущем меню, чтобы узнать параметры перехода (например, skipHistory)
          let skipHistory = false;
          const currentMenuId = ctx.session.currentMenuId;
          if (currentMenuId) {
            let currentMenu = this.menuManager.menus.get(currentMenuId);
            // Если меню нет в кэше (динамическое), пробуем разрешить его заново
            if (!currentMenu && this.menuManager.dynamicMenuResolver) {
              try {
                currentMenu = await this.menuManager.dynamicMenuResolver(ctx as CallbackContext, currentMenuId);
              } catch (e) { /* Игнорируем ошибки разрешения старого меню */ }
            }

            if (currentMenu) {
              const buttons = typeof currentMenu.buttons === "function" ? await currentMenu.buttons(ctx as CallbackContext) : currentMenu.buttons;
              // Ищем кнопку, которая ведет в вызываемое меню
              const btn = buttons.find(b =>
                (b.callback && b.callback === menuId) ||
                (b.nextMenu && b.nextMenu === menuId)
              );
              if (btn && btn.skipHistory) skipHistory = true;
            }
          }

          return await this.menuManager.showMenu(ctx as CallbackContext, menuId, false, skipHistory);
        } catch (e) {
          console.error(`Ошибка при открытии меню ${menuId}:`, e);
        }
      }

      return next();
    });
  }

  registerMenuHandlers(menu: MenuBase) {
    const buttons = menu.buttons;
    if (buttons && Array.isArray(buttons)) {
      buttons.forEach((btn: MenuButton) => {
        if (menu.inline) {
          // Inline кнопки
          this.client.callbackQuery(btn.callback, async (ctx) => {
            try {
              await ctx.answerCallbackQuery();
              // const buttonText = await ctx.resolveText(btn.text);
              // console.log(`🔘 Нажата кнопка: "${buttonText}"`);
              // 1. Если callback совпадает с именем сцены — запускаем сцену
              const scene = this.client.sceneManager.getScene(btn.callback);
              if (scene) {
                return this.client.sceneManager.enter(ctx, btn.callback);
              }
              // 2. Если указан nextMenu — показываем меню
              if (btn.nextMenu) {
                return this.menuManager.showMenu(ctx, btn.nextMenu, false, btn.skipHistory);
              }
              // 3. Если есть кастомное действие — выполняем его
              if (btn.action) {
                return btn.action(ctx);
              }
            } catch (error) {
              console.error(`❌ Ошибка при обработке кнопки:`, error);
            }
          });
        } // Обработка Reply-кнопок теперь вынесена в центральный обработчик в методе init()
      });
    }
  }

  // --- Методы-создатели для динамических меню ---

  private async _createAddressMenu(_ctx: CallbackContext, id: string, param?: string): Promise<MenuBase | undefined> {
    if (await Address.findById(id)) {
      const accounts = await Account.find({ address_id: id });
      const page = param ? parseInt(param, 10) : 0;
      return new AddressMenu(this.client, id, accounts, page);
    }
    return undefined;
  }

  private async _createAccountMenu(_ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const account = await Account.findById(id);
    if (account) {
      return new AccountMenu(this.client, id, account);
    }
    return undefined;
  }

  private async _createReadingsMenu(_ctx: CallbackContext, id: string, param?: string): Promise<MenuBase | undefined> {
    let year = param ? parseInt(param, 10) : undefined;
    if (!year) {
      const latestReading = await UtilitiesReading.findOne({ account_id: id }).sort({ year: -1 });
      year = latestReading ? latestReading.year : new Date().getFullYear();
    }

    const readings = await UtilitiesReading.find({ account_id: id, year }).sort({ month: -1 });
    const account = await Account.findById(id);

    if (account) {
      return new ReadingsMenu(this.client, id, year, readings);
    }
    return undefined;
  }

  private async _createReadingMenu(_ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const reading = await UtilitiesReading.findById(id);
    if (reading) {
      return new ReadingMenu(this.client, id, reading);
    }
    return undefined;
  }

  private async _createTariffsMenu(_ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const account = await Account.findById(id);
    if (account) {
      const tariffs = await Tariff.find({ account_id: id }).sort({ startDate: -1 });
      return new TariffsMenu(this.client, id, tariffs, account.currency);
    }
    return undefined;
  }

  private async _createTariffMenu(_ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const tariff = await Tariff.findById(id);
    if (tariff) {
      const account = await Account.findById(tariff.account_id);
      if (account) {
        return new TariffMenu(this.client, id, tariff, account.currency);
      }
    }
    return undefined;
  }

  private async _createFixedFeesMenu(_ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const account = await Account.findById(id);
    if (account) {
      const fees = await FixedFee.find({ account_id: id }).sort({ startDate: -1 });
      return new FixedFeesMenu(this.client, id, fees, account.currency);
    }
    return undefined;
  }

  private async _createFixedFeeMenu(_ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const fee = await FixedFee.findById(id);
    if (fee) {
      const account = await Account.findById(fee.account_id);
      if (account) {
        return new FixedFeeMenu(this.client, id, fee, account.currency);
      }
    }
    return undefined;
  }

  private async _createAddressUsersMenu(ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const address = await Address.findById(id);
    if (address) {
      const userAddresses = await UserAddress.find({ address_id: id, telegram_id: { $ne: ctx.from?.id } });
      const userIds = userAddresses.map(ua => ua.telegram_id);
      const users = await User.find({ telegram_id: { $in: userIds } });
      return new AddressUsersMenu(this.client, id, users, address.name);
    }
    return undefined;
  }

  private async _createAddressUserMenu(_ctx: CallbackContext, id: string, param?: string): Promise<MenuBase | undefined> {
    const targetUserId = param ? parseInt(param, 10) : 0;
    const targetUser = await User.findOne({ telegram_id: targetUserId });
    if (targetUser) {
      return new AddressUserMenu(this.client, id, targetUser);
    }
    return undefined;
  }

  private async _createReminderMenu(_ctx: CallbackContext, id: string): Promise<MenuBase | undefined> {
    const reminder = await Reminder.findById(id);
    if (reminder) {
      return new ReminderMenu(this.client, id, reminder);
    }
    return undefined;
  }
}
