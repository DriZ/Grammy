/**
 * Конфигурация бота
 *
 * В TypeScript мы используем интерфейсы (interface) или типы (type)
 * для описания структуры конфигурации. Это даёт нам:
 * 1. Автодополнение в IDE
 * 2. Проверку типов при разработке
 * 3. Самодокументирующийся код
 */

import type { BotConfig } from "./types/index.js";

// Создаём конфигурацию с явным типом
const config: BotConfig = {
  // ID владельца бота (из переменной окружения)
  owner: process.env.BOT_OWNER_ID ? parseInt(process.env.BOT_OWNER_ID) : null,

  // ID администраторов бота
  admins: process.env.BOT_ADMINS
    ? process.env.BOT_ADMINS.split(",").map((id) => parseInt(id.trim()))
    : [],

  // Уровни доступа
  permissions: {
    EVERYONE: 0,
    ADMIN: 1,
    OWNER: 2,
  },
};

export default config;
