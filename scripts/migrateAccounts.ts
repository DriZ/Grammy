import { connect, disconnect } from "mongoose";
import { Account } from "../models/index.js";
import { EResource } from "../types/index.js";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

async function createBackup(mongoUrl: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", `backup-${timestamp}`);

  console.log(`📦 Создание бэкапа в ${backupDir}...`);

  try {
    await execAsync(`mongodump --uri="${mongoUrl}" --out="${backupDir}"`);
    console.log("✅ Бэкап успешно создан!");
  } catch (error) {
    throw new Error(`Ошибка создания бэкапа (проверьте наличие mongodump): ${error}`);
  }
}

async function migrate() {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error("MONGODB_URL не установлена! Убедитесь, что .env файл существует или переменные окружения заданы.");
    }

    await createBackup(mongoUrl);

    console.log("⏳ Подключение к БД...");
    await connect(mongoUrl);
    console.log("✅ Подключение успешно");

    const accounts = await Account.find();
    console.log(`🔍 Найдено аккаунтов: ${accounts.length}`);

    let updatedCount = 0;

    for (const account of accounts) {
      let isModified = false;

      // 1. Миграция валюты (если нет, Mongoose подставит default "UAH" при загрузке, но мы сохраним это явно)
      if (!account.currency) {
        account.currency = "UAH";
        isModified = true;
      }

      // 2. Миграция единиц измерения
      if (!account.unit) {
        // Получаем дефолтную единицу для ресурса
        const resourceData = EResource[account.resource as keyof typeof EResource];
        if (resourceData && resourceData.units && resourceData.units.length > 0) {
          account.unit = resourceData.units[0];
          isModified = true;
        }
      }

      if (isModified) {
        await account.save();
        updatedCount++;
        console.log(`✏️ Обновлен аккаунт ${account.account_number} (${account.resource}): ${account.currency}, ${account.unit}`);
      }
    }

    console.log(`🎉 Миграция завершена. Обновлено документов: ${updatedCount}`);
  } catch (error) {
    console.error("❌ Ошибка миграции:", error);
  } finally {
    await disconnect();
    process.exit();
  }
}

migrate();
