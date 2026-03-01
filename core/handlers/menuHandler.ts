/* eslint-disable no-case-declarations */
/**
 * menuHandler.ts - Обработчик меню/кнопок
 * 
 * Управляет обработкой событий и отображением интерактивных меню
 */

import type { CallbackContext, IMenu, IMenuButton } from "@app-types/index.js";
import type BotClient from "@core/Client.js";
import { InlineKeyboard } from "grammy";
import { Account, Address, Tariff, UtilitiesReading, FixedFee } from "@models/index.js";
import { AccountMenu } from "@menus/accountMenus.js";
import { AddressMenu } from "@menus/addressMenus.js";
import { ReadingsMenu, ReadingMenu } from "@menus/readingMenus.js";
import { TariffMenu, TariffsMenu } from "@menus/tariffMenus.js";
import { FixedFeesMenu, FixedFeeMenu } from "@menus/fixedFeeMenus.js";
import { MenuManager } from "@managers/index.js";

/**
 * Обработчик меню
 */
export class MenuHandler {
  private client: BotClient;
  private menuManager: MenuManager;

  /**
   * Конструктор
   * @param client - экземпляр BotClient
   */
  constructor(client: BotClient, menuManager: MenuManager) {
    this.client = client;
    this.menuManager = menuManager;
  }

  /**
   * Инициализация слушателей событий
   */
  init() {
    // Настраиваем резолвер для динамических меню
    this.menuManager.dynamicMenuResolver = async (ctx, menuId) => {
      const match = menuId.match(/^(account|address|reading|readings|tariff|tariffs|fixed-fees|fixed-fee)-([a-fA-F0-9]{24})(?:-(\d+))?$/);
      if (!match) return undefined;

      const [, prefix, id, param] = match;
      let newMenu: IMenu | undefined = undefined;

      try {
        switch (prefix) {
          case "address":
            if (await Address.findById(id)) {
              const accounts = await Account.find({ address_id: id });
              const page = param ? parseInt(param, 10) : 0;
              newMenu = new AddressMenu(this.client, id, accounts, page);
            }
            break;
          case "account":
            const account = await Account.findById(id);
            if (account)
              newMenu = new AccountMenu(this.client, id, account);
            break;
          case "readings":
            let year = param ? parseInt(param, 10) : undefined;
            // Если год не указан, берем год последнего показания или текущий
            if (!year) {
              const latestReading = await UtilitiesReading.findOne({ account_id: id }).sort({ year: -1 });
              year = latestReading ? latestReading.year : new Date().getFullYear();
            }

            const readings = await UtilitiesReading.find({ account_id: id, year }).sort({ month: -1 });
            const readingsAccount = await Account.findById(id);

            if (readingsAccount)
              newMenu = new ReadingsMenu(this.client, id, year, readings);
            break;
          case "reading":
            const reading = await UtilitiesReading.findById(id);
            if (reading)
              newMenu = new ReadingMenu(this.client, id, reading);
            break;
          case "tariffs":
            const tariffsAccount = await Account.findById(id);
            if (tariffsAccount) {
              const tariffs = await Tariff.find({ account_id: id }).sort({ startDate: -1 });
              newMenu = new TariffsMenu(this.client, id, tariffs, tariffsAccount.currency);
            }
            break;
          case "tariff":
            const tariff = await Tariff.findById(id);
            if (tariff) {
              const tAccount = await Account.findById(tariff.account_id);
              if (tAccount) newMenu = new TariffMenu(this.client, id, tariff, tAccount.currency);
            }
            break;
          case "fixed-fees":
            const ffAccount = await Account.findById(id);
            if (ffAccount) {
              const fees = await FixedFee.find({ account_id: id }).sort({ startDate: -1 });
              newMenu = new FixedFeesMenu(this.client, id, fees, ffAccount.currency);
            }
            break;
          case "fixed-fee":
            const fee = await FixedFee.findById(id);
            if (fee) {
              const fAccount = await Account.findById(fee.account_id);
              if (fAccount) newMenu = new FixedFeeMenu(this.client, id, fee, fAccount.currency);
            }
            break;
        }
      } catch (error) {
        console.error(`❌ Ошибка при создании меню "${menuId}":`, error);
      }
      return newMenu;
    };

    // Централизованный обработчик для всех текстовых сообщений, чтобы ловить нажатия Reply-кнопок
    // this.client.on("message:text", async (ctx, next) => {
    //   const text = ctx.message.text;
    //   let handled = false;

    //   // 1. Проверяем специальные кнопки, которые не являются частью стандартных меню (например, "Команды")
    //   if (text === ctx.t("main-menu.button-commands")) {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     await this.menuManager.showMenu(ctx as any, "commands-list");
    //     handled = true;
    //   }

    //   // 2. Если не обработано, ищем совпадение среди кнопок всех не-inline меню
    //   if (!handled) {
    //     for (const menu of this.menuManager.menus.values()) {
    //       if (menu.inline) continue; // Пропускаем inline-меню

    //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //       const buttons = typeof menu.buttons === "function" ? await menu.buttons(ctx as any) : menu.buttons;
    //       for (const btn of buttons) {
    //         const buttonText = await ctx.resolveText(btn.text);
    //         if (text === buttonText) {
    //           try {
    //             console.log(`🔘 Reply кнопка нажата: "${buttonText}"`);
    //             if (ctx.message) await ctx.msg.delete().catch(() => { });
    //             if (btn.nextMenu) {
    //               // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //               await this.menuManager.showMenu(ctx as any, btn.nextMenu, false, btn.skipHistory);
    //             } else if (btn.action) {
    //               // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //               await btn.action(ctx as any);
    //             }
    //           } catch (error) {
    //             console.error(`❌ Ошибка при обработке reply кнопки "${buttonText}":`, error);
    //           }
    //           handled = true;
    //           break; // Кнопка найдена, выходим из внутреннего цикла
    //         }
    //       }
    //       if (handled) break; // Меню обработано, выходим из внешнего цикла
    //     }
    //   }

    //   // 3. Если ни одна кнопка не подошла, передаем управление дальше (например, командам)
    //   if (!handled) {
    //     await next();
    //   }
    // });

    // Регистрируем глобальный обработчик для динамических кнопок команд
    this.client.callbackQuery(/^cmd:(.+)$/, async (ctx) => {
      const match = ctx.match as RegExpMatchArray;
      // console.log(`Словил кнопку команды: ${match[1]}`);
      const commandName = match[1];
      const command = this.client.commandManager.commands.get(commandName);

      if (command) {
        await ctx.answerCallbackQuery();

        // Переопределяем reply для редактирования сообщения и добавления кнопки Назад
        const originalReply = ctx.reply.bind(ctx);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx as any).reply = async (text: string, extra: any = {}) => {
          const backBtn = { text: "🔙 Назад", callback_data: "commands-list" };

          if (!extra.reply_markup) {
            extra.reply_markup = new InlineKeyboard().row(backBtn);
          } else if (extra.reply_markup instanceof InlineKeyboard) {
            extra.reply_markup.row().text(backBtn.text, backBtn.callback_data);
          } else if (extra.reply_markup.inline_keyboard) {
            extra.reply_markup.inline_keyboard.push([backBtn]);
          }

          try {
            return await ctx.editMessageText(text, extra);
          } catch (e) {
            // Если редактирование невозможно (например, контент не изменился), отправляем новое
            return await originalReply(text, extra);
          }
        };

        // Выполняем команду. Передаем пустые аргументы.
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await command.execute(ctx as any, []);
        } catch (e) {
          console.error(`Ошибка выполнения команды ${commandName} из меню:`, e);
          await originalReply("❌ Ошибка при выполнении команды.");
        }
      } else {
        await ctx.answerCallbackQuery("⚠️ Команда не найдена или отключена.");
      }
    });

    // Обработчик кнопки "Назад"
    this.client.callbackQuery("menu-back", async (ctx) => {
      await ctx.answerCallbackQuery();
      return this.menuManager.goBack(ctx as CallbackContext);
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
      const isDynamic = /^(readings|address|account|reading|tariff|tariffs|fixed-fees|fixed-fee)-([a-fA-F0-9]{24})(?:-(\d+))?$/.test(menuId);

      if (isStatic || isDynamic) {
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

  registerMenuHandlers(menu: IMenu) {
    const buttons = menu.buttons;
    if (buttons && Array.isArray(buttons)) {
      buttons.forEach((btn: IMenuButton) => {
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
}
