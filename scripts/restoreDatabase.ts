import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

async function restore() {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    console.error("❌ MONGODB_URL не установлена! Убедитесь, что .env файл существует.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("❌ Укажите путь к бэкапу. Пример: npm run restore backups/backup-YYYY-MM-DD...");
    process.exit(1);
  }

  const backupDir = args[0];
  const fullPath = path.resolve(process.cwd(), backupDir);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Папка бэкапа не найдена: ${fullPath}`);
    process.exit(1);
  }

  console.log(`⏳ Восстановление базы данных из: ${fullPath}`);
  console.log("⚠️  ВНИМАНИЕ: Текущие данные в базе будут перезаписаны (используется флаг --drop)!");
  
  // Даем 3 секунды на отмену (Ctrl+C), если передумали
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // --drop удаляет коллекции перед восстановлением, чтобы избежать дубликатов
    await execAsync(`mongorestore --uri="${mongoUrl}" --drop "${fullPath}"`);
    console.log("✅ Восстановление завершено успешно.");
  } catch (error) {
    console.error("❌ Ошибка при восстановлении (проверьте наличие mongorestore):", error);
    process.exit(1);
  }
}

restore();
