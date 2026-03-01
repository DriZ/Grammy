start-message = Привіт! Я бот.
help-message =
  Це справочне повідомлення.
  Доступні команди: /start, /help
menu =
  .not-found = ❌ Меню не знайдено
  .title = 🤖 **Виберіть команду:**

scene =
  .action-canceled = ❌ Створення скасовано

command =
  .reloading = ♻️ Перезавантаження команди...
  .unload = ♻️ Вигружаю команду...
  .load = ♻️ Вигружено. Завантажую команду...
  .reloaded = ♻️ Команда перезавантажена!

main-menu =
  .not-found = ❌ Головне меню не знайдено
  .title = 👋 Привіт! Виберіть дію:
  .button-ping = 🏓 Пінг
  .button-whoami = 👤 Про мене
  .button-myid = 🆔 Моє айді
  .button-commands = 🤖 Команди
utilities-menu =
  .title = ⚙️ Комунальні послуги
account-menu =
  .title = Меню рахунку №
address-menu =
  .title = 📋 Рахунки за адресою
readings-menu =
  .title = 📊 Показання за { $year } рік
  .consumption = Споживання
reading-menu =
  .title = 📊 Показання
  .reading-for = 📊 Показання за

## Buttons
button =
  .create-address = ➕ Створити адресу
  .close = ❌ Закрити
  .change-language = 🌐 Мова / Language
  .back = ⬅️ Назад
  .delete = 🗑️ Видалити
  .cancel = ❌ Скасувати
  .tariffs = 💲 Тарифи
  .calculate-bill = 🧾 До оплати
  .readings = 📊 Показання
  .delete-account = 🗑️ Видалити рахунок
  .account = Рахунок №
  .create-account = ➕ Додати рахунок
  .delete-address = 🗑️ Видалити адресу
  .create-reading = ➕ Додати показання
  .delete-reading = 🗑️ Видалити показання
  .create-tariff = ➕ Додати тариф
  .delete-tariff = 🗑️ Видалити тариф
  .home = 🏠 Додому

error =
  .admin-only = ❌ Ця команда доступна лише для адміністраторів.
  .owner-only = ❌ Ця команда доступна лише власнику бота.
  .command-failed = ❌ Помилка при виконанні команди.
  .command-not-found = ❌ Команда { $name } не знайдена.
  .command-path-not-found = ❌ Не вдалося перезавантажити команду: шлях до файлу не знайдено.
  .command-reload-failed = ❌ Не вдалося перезавантажити команду.
  .reading-not-found = ❌ Показання не знайдено

items-count = { $count ->
  [one] { $count } товар
  [few] { $count } товару
  *[many] { $count } товарів
}

units =
  .electricity = кВт·год
  .water = м³
  .gas = м³

language-select-title = 🌐 Оберіть мову:
language-selected = ✅ Мову успішно змінено!