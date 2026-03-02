import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, "..", "locales");
// Язык по умолчанию, с которым будем сравнивать остальные (можно задать через ENV)
const defaultLocale = process.env.DEFAULT_LOCALE || "ru";

/**
 * Парсит содержимое FTL файла и возвращает набор ключей.
 * Поддерживает сообщения (key =) и атрибуты (.attr =).
 */
function extractKeys(content: string): Set<string> {
  const keys = new Set<string>();
  const lines = content.split("\n");
  let currentMessageId: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // Пропускаем комментарии и пустые строки
    if (!trimmed || trimmed.startsWith("#")) continue;

    // 1. Проверяем ID сообщения (начало строки)
    // Формат: message-id = value
    const messageMatch = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
    if (messageMatch) {
      currentMessageId = messageMatch[1];
      keys.add(currentMessageId);
      continue;
    }

    // 2. Проверяем атрибуты (с отступом)
    // Формат: .attribute = value
    const attrMatch = line.match(/^\s+\.([a-zA-Z0-9_-]+)\s*=/);
    if (attrMatch && currentMessageId) {
      keys.add(`${currentMessageId}.${attrMatch[1]}`);
    }
  }
  return keys;
}

async function checkLocales() {
  console.log(`🔍 Проверка целостности переводов...`);
  console.log(`ℹ️  Эталонный язык: ${defaultLocale}`);

  if (!fs.existsSync(localesDir)) {
    console.error(`❌ Папка locales не найдена: ${localesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(localesDir).filter((file) => file.endsWith(".ftl"));
  const defaultFile = `${defaultLocale}.ftl`;

  if (!files.includes(defaultFile)) {
    console.error(`❌ Файл эталонного языка ${defaultFile} не найден!`);
    process.exit(1);
  }

  const defaultContent = fs.readFileSync(path.join(localesDir, defaultFile), "utf-8");
  const defaultKeys = extractKeys(defaultContent);
  console.log(`🔑 Найдено ключей в эталоне: ${defaultKeys.size}`);

  let hasErrors = false;

  for (const file of files) {
    if (file === defaultFile) continue;

    const content = fs.readFileSync(path.join(localesDir, file), "utf-8");
    const keys = extractKeys(content);
    const missingKeys: string[] = [];

    for (const key of defaultKeys) {
      if (!keys.has(key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      hasErrors = true;
      console.error(`\n❌ В файле ${file} отсутствуют ключи:`);
      missingKeys.forEach((k) => console.error(`   - ${k}`));
    } else {
      console.log(`✅ ${file}: OK`);
    }
  }

  if (hasErrors) {
    console.error("\n❌ Проверка не пройдена. Добавьте недостающие ключи.");
    process.exit(1);
  } else {
    console.log("\n🎉 Все файлы переводов синхронизированы.");
  }
}

checkLocales();
