start-message = Привет! Я бот.
help-message =
  Это справочное сообщение.
  Доступные команды: /start, /help
menu =
  .not-found = ❌ Меню не найдено
  .title = 🤖 **Выберите команду:**

scene =
  .action-canceled = ❌ Действие отменено

command =
  .reloading = ♻️ Перезагрузка команды...
  .unload = ♻️ Выгружаю команду...
  .load = ♻️ Выгружено. Загружаю команду...
  .reloaded = ♻️ Команда перезагружена!

main-menu =
  .not-found = ❌ Главное меню не найдено
  .title = 👋 Привет! Выберите действие:
  .button-ping = 🏓 Пинг
  .button-whoami = 👤 Обо мне
  .button-myid = 🆔 Мой айди
  .button-commands = 🤖 Команды
utilities-menu = 
  .title = ⚙️ Коммунальные услуги
account-menu =
  .title = Меню счёта №
address-menu =
  .title = 📋 Счета по адресу
readings-menu =
  .title = 📊 Показания за { $year } год
  .consumption = Потребление
reading-menu =
  .title = 📊 Показание
  .reading-for = 📊 Показание за

## Buttons
button =
  .create-address = ➕ Создать адрес
  .close = ❌ Закрыть
  .change-language = 🌐 Язык / Language
  .back = ⬅️ Назад
  .delete = 🗑️ Удалить
  .cancel = ❌ Отменить
  .tariffs = 💲 Тарифы
  .calculate-bill = 🧾 К оплате
  .readings = 📊 Показания
  .delete-account = 🗑️ Удалить счёт
  .account = Счёт №
  .create-account = ➕ Добавить счёт
  .delete-address = 🗑️ Удалить адрес
  .create-reading = ➕ Добавить показание
  .delete-reading = 🗑️ Удалить показание
  .create-tariff = ➕ Добавить тариф
  .delete-tariff = 🗑️ Удалить тариф
  .home = 🏠 Домой

error =
  .admin-only = ❌ Эта команда доступна только администраторам.
  .owner-only = ❌ Эта команда доступна только владельцу бота.
  .command-failed = ❌ Ошибка при выполнении команды.
  .command-not-found = ❌ Команда { $name } не найдена.
  .command-path-not-found = ❌ Не удалось перезагрузить команду: путь к файлу не найден.
  .command-reload-failed = ❌ Не удалось перезагрузить команду.
  .reading-not-found = ❌ Показание не найдено

items-count = { $count ->
  [one] { $count } товар
  [few] { $count } товара
  *[many] { $count } товаров
}
units =
  .electricity = кВт·ч
  .water = м³
  .gas = м³

language-select-title = 🌐 Выберите язык:
language-selected = ✅ Язык успешно изменен!