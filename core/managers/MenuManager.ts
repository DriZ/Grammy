import path from "path";
import { fileURLToPath } from "url";
import type { CallbackContext, MenuBase, MenuButton, MenuModule } from "../../types/index.js";
import type BotClient from "../Client.js";
import config from "../../config.js";
import { EPermissionLevel, type TPermissionLevel } from "../../types/index.js";
import { InlineKeyboard } from "grammy";
import { BaseMenu } from "../structures/index.js";
import { BaseManager } from "./BaseManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Менеджер меню
 * Хранит, загружает, управляет доступом и предоставляет данные для меню.
 */
export class MenuManager extends BaseManager {
  public menus: Map<string, MenuBase>;
  public dynamicMenuResolver: ((ctx: CallbackContext, menuId: string) => Promise<MenuBase | undefined>) | undefined = undefined;

  constructor(client: BotClient) {
    super(client);
    this.menus = new Map();
  }

  async loadMenu(menuPath: string): Promise<void> {
    // Этот метод можно использовать для ручной загрузки одного файла
    // Но основная логика теперь в loadFiles

    const module = await this.importModule<MenuModule>(`file://${menuPath}`);
    if (!module) return;

    const Exported = module.default;

    // Пропускаем файлы без default export (например, утилиты или фабрики меню)
    if (!Exported) return;

    let menu: MenuBase | null = null;
    if (Exported.prototype instanceof BaseMenu) {
      menu = new Exported(this.client);
    }

    if (!menu || !menu.id) return;
    this.menus.set(menu.id, menu);
    this.log(`✅ Menu loaded: ${menu.id}`);
  }

  async loadMenus(menusDir: string = path.join(__dirname, "..", "..", "menus")): Promise<Map<string, MenuBase>> {
    await this.loadFiles<MenuModule>(menusDir, "**/*.js", async (module) => {
      const Exported = module.default;
      if (!Exported) return;

      let menu: MenuBase | null = null;
      if (Exported.prototype instanceof BaseMenu) {
        menu = new Exported(this.client);
      }

      if (!menu || !menu.id) return;
      this.menus.set(menu.id, menu);
      this.log(`✅ Menu loaded: ${menu.id}`);
    });

    this.log(`📦 Total menus loaded: ${this.menus.size}`);
    return this.menus;
  }

  registerMenu(id: string, menu: MenuBase) {
    // Не пытаемся резолвить заголовок при регистрации, так как это может быть асинхронная операция
    this.log(`⤵️ Registering menu: ${id}`);
    return this.menus.set(id, menu);
  }

  /**
   * Удаляет меню и корректирует навигацию, чтобы исключить удаленный элемент из истории.
   * @param ctx Контекст
   * @param deletedMenuId ID удаляемого меню (которое нужно стереть из памяти и истории)
   * @param parentMenuId ID родительского меню (куда пользователь должен попасть). По умолчанию main-menu
   */
  cleanupForDeletion(ctx: CallbackContext, deletedMenuId: string, parentMenuId: string = "main-menu") {
    // 1. Удаляем само меню из реестра
    this.menus.delete(deletedMenuId);

    // 2. Подменяем текущее меню на родительское, чтобы удаленное не попало в историю при переходе
    ctx.session.currentMenuId = parentMenuId;

    // 3. Если родительское меню уже есть на вершине стека — убираем его, чтобы не было дубля
    const stack = ctx.session.menuStack;
    if (stack.length > 0 && stack[stack.length - 1] === parentMenuId) {
      stack.pop();
    }
  }

  getAvailableCommandButtons(ctx: CallbackContext): MenuButton[] {
    const userId = ctx.from?.id;
    const isOwner = config.owner && userId === config.owner;
    const isAdmin = config.admins && config.admins.includes(userId || 0);

    let userPerm: TPermissionLevel = EPermissionLevel.User;
    if (isAdmin) userPerm = EPermissionLevel.Admin;
    if (isOwner) userPerm = EPermissionLevel.Owner;

    const buttons: MenuButton[] = [];

    this.client.commandManager.commands.forEach((cmd) => {
      if (cmd.config.permission > userPerm) return;
      if (!cmd.config.enabled) return;
      if (cmd.config.showInMenu === false) return;

      buttons.push({
        text: `🔹 ${cmd.info.description || cmd.info.name}`,
        callback: `cmd:${cmd.info.name}`,
      } as MenuButton);
    });

    return buttons;
  }

  /**
   * Добавляет кнопки навигации (Назад/Домой) в клавиатуру
   */
  private addNavigationButtons(ctx: CallbackContext, keyboard: InlineKeyboard) {
    if (ctx.session.menuStack.length > 0) {
      keyboard.row().text(ctx.t("button.back"), "menu-back");
    }
    if (ctx.session.menuStack.length > 1) {
      keyboard.text(ctx.t("button.home"), "main-menu");
    }
  }

  /**
   * Вернуться назад по истории меню
   */
  async goBack(ctx: CallbackContext): Promise<void> {
    const prevMenuId = ctx.session.menuStack.pop();
    if (!prevMenuId) {
      return this.showMenu(ctx, "main-menu");
    }
    return this.showMenu(ctx, prevMenuId, true);
  }

  /**
   * Показать меню пользователю
   * @param ctx - контекст Telegraf
   * @param id - id меню
   * @param isBack - флаг, указывающий, что это переход назад (не нужно пушить в историю)
   */
  async showMenu(ctx: CallbackContext, nextMenu: string | MenuBase | null = null, isBack: boolean = false, skipHistory: boolean = false): Promise<void> {
    let menuId: string;
    let menuObj: MenuBase | undefined;

    if (nextMenu && typeof nextMenu === 'object') {
      menuObj = nextMenu;
      menuId = menuObj.id;
    } else {
      menuId = (nextMenu as string) || ctx.callbackQuery?.data || "";
    }

    if (menuId === "delete-msg") {
      await ctx.msg?.delete().catch(() => { });
      return;
    }

    // --- ЛОГИКА ХЛЕБНЫХ КРОШЕК ---
    // Если переходим в главное меню — очищаем историю
    if (menuId === "main-menu") {
      ctx.session.menuStack = [];
    }
    // Если это обычный переход (не назад) и мы меняем меню — сохраняем текущее в историю
    else if (!isBack && !skipHistory && ctx.session.currentMenuId && ctx.session.currentMenuId !== menuId) {
      // Не добавляем в стек, если мы просто обновляем то же самое меню
      ctx.session.menuStack.push(ctx.session.currentMenuId);
    }

    // Обновляем текущее меню
    ctx.session.currentMenuId = menuId;
    // -----------------------------

    if (menuId === "commands-list") {
      const buttons = this.getAvailableCommandButtons(ctx);
      const keyboard = new InlineKeyboard();

      // Группируем по 2 кнопки в ряд
      for (let i = 0; i < buttons.length; i += 2) {
        const b1 = buttons[i];
        const b2 = buttons[i + 1];
        keyboard.text(await ctx.resolveText(b1.text), b1.callback);
        if (b2) keyboard.text(await ctx.resolveText(b2.text), b2.callback);
        keyboard.row();
      }

      // Добавляем кнопку Назад, если есть история
      this.addNavigationButtons(ctx, keyboard);

      const text = ctx.t("menu.title");
      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: "HTML" });
      } else {
        await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
      }
      return;
    }

    // 1. Ищем в статических/зарегистрированных меню
    // 2. Если передан объект, используем его
    // 3. Если нет, пробуем разрешить динамически через Resolver
    const menu = this.menus.get(menuId) || menuObj || (this.dynamicMenuResolver ? await this.dynamicMenuResolver(ctx, menuId) : null);

    if (!menu) {
      await ctx.reply(ctx.t("menu.not-found"));
      return;
    }
    this.log(`⤵️ Loading menu: ${menu.id}`);

    // Получаем кнопки (поддерживаем и массив, и функцию)
    const buttons = typeof menu.buttons === "function" ? await menu.buttons(ctx) : menu.buttons;

    // Создаём клавиатуру из кнопок меню
    const keyboard = new InlineKeyboard();

    for (const b of buttons) {
      const buttonText = await ctx.resolveText(b.text);
      keyboard.text(buttonText, b.callback || b.nextMenu || "noop");
      if (b.style) keyboard.style(b.style);
      if (b.row) keyboard.row();
    }

    // Автоматически добавляем кнопку "Назад" и "Домой", если есть куда возвращаться
    this.addNavigationButtons(ctx, keyboard);

    const menuTitle = await ctx.resolveText(menu.title);
    ctx.callbackQuery
      ? await ctx.callbackQuery.message?.editText(menuTitle, { reply_markup: keyboard, parse_mode: "HTML" })
      : await ctx.reply(menuTitle, { reply_markup: keyboard, parse_mode: "HTML" });
    return;
  }
}
