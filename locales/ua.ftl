start-message = Привіт! Я бот.
help-message =
  Це справочне повідомлення.
  Доступні команди: /start, /help
menu =
  .not-found = ❌ Меню не знайдено
  .title = 🤖 <b>Виберіть команду:</b>

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
  .title = 📋 Рахунки за адресою <b>{ $address }</b>
  .owner-details =
    #️⃣ <b>ID:</b> <code>{ $id }</code>
    🔗 <b>Посилання-запрошення:</b>
    <code>{ $link }</code>
    
    ℹ️ <i>Щоб поділитись адресою, передайте цей ID або посилання іншому користувачеві.</i>

    ℹ️ <i> Щоб видалити цю адресу, спочатку видаліть у ньому всі рахунки.</i>
readings-menu =
  .title = 📊 Показання за <b>{ $year }</b> рік
  .consumption = Споживання
reading-menu =
  .title = 📊 Показання
  .reading-for = 📊 Показання за
fixed-fee-menu =
  .title = 📌 Абонплата
  💰 Сума: { $amount }
  📆 Початок дії : { $startDate }
address-users-menu =
  .title = 👥 Користувачі адреси <b>{ $address }</b>
address-user-menu =
  .title = 👤 Користувач: <b>{ $user }</b>
reminders-menu =
  .title = ⏰ Ваші нагадування (Часовий пояс: <b>{ $timezone }</b>)
reminder-menu =
  .title = ⏰ Нагадування: <b>{ $title }</b>
    📅 День: <b>{ $day }</b>
    🔔 Статус: <b>{ $status }</b>

reminder =
  .enabled = Увімкнено
  .disabled = Вимкнено
  .message = 🔔 <b>Нагадування!</b>
    Настав час внести показання лічильників.
    У вас є рахунки без показань за цей місяць: <b>{ $count }</b>.

## Buttons
button =
  .create-address = ➕ Створити адресу
  .close = ❌ Закрити
  .change-language = 🌐 Мова / Language
  .back = ⬅️ Назад
  .delete = 🗑️ Видалити
  .cancel = ❌ Скасувати
  .tariffs = 💲 Тарифи
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
  .add-more = ➕ Додати ще
  .subscription-fee = 💰 Абонплата
  .currency = 💱 Валюта
  .unit = 📏 Единиця виміру
  .calculate-bill = 🧾 Рахунок
  .calculate-all-bills = 🧾 Розрахувати всі рахунки
  .fixed-fees = 💰 Абонплата / фіксовані платежі
  .create-fixed-fee = ➕ Додати абонплату
  .unlink-address = 🔗 Відв'язати адресу
  .transfer-address = 👑 Передати права

error =
  .admin-only = ❌ Ця команда доступна лише для адміністраторів.
  .owner-only = ❌ Ця команда доступна лише власнику бота.
  .command-failed = ❌ Помилка при виконанні команди.
  .command-not-found = ❌ Команда { $name } не знайдена.
  .command-path-not-found = ❌ Не вдалося перезавантажити команду: шлях до файлу не знайдено.
  .command-reload-failed = ❌ Не вдалося перезавантажити команду.
  .reading-not-found = ❌ Показання не знайдено
  .no-account-id = ❌ Помилка: не вказано ID рахунку.
  .account-not-found = ❌ Рахунок не знайдено.
  .no-telegram-id = ❌ Помилка: не вдалося отримати ваш Telegram ID.
  .invalid-number = ❌ Введіть коректне число.
  .not-found = ❌ Запис не знайдено.
  .address-not-found = ❌ Адреса { $id } не знайдена.

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

resource =
  .electricity = ⚡ Електрика
  .heating = 🌡️ Опалення
  .water = 💧 Вода
  .gas = 🔥 Газ
  .internet = 🌐 Інтернет
  .garbage = 🗑️ Сміття
  .other = 📦 Інше

meter-type =
  .single = Однотарифний
  .day-night = День/Ніч
  .multi-zone = Багатозонний

create-account =
  .ask-resource = Оберіть тип ресурсу:
  .cancelled = ❌ Створення рахунку скасовано.
  .ask-meter-type = Оберіть тип лічильника:
  .ask-unit = Оберіть одиницю виміру для { $emoji } { $resource }:
  .ask-currency = Оберіть валюту:
  .ask-number = Валюта: { $currency }. Введіть номер рахунку:
  .ask-number-text = Введіть номер рахунку текстом:
  .success = ✅ Рахунок { $account } ({ $emoji } { $resource }{ $meter }) успішно додано.
  .meter-label = лічильник
  .error = ❌ Помилка при створенні рахунку.

create-address =
  .ask = Введіть зрозумілу назву рядком
  .cancelled = ❌ Створення адреси скасовано.
  .error-text-required = ❌ Будь ласка, введіть адресу рядком.
  .success = ✅ Адресу 🏠 { $address } успішно додано.
  .error = ❌ Помилка при додаванні адреси.
  .already-exists = ❌ Адреса { $address } вже є у ваших адресах.

create-reading =
  .ask-date = 📅 Оберіть місяць для введення показань ({ $year }):
  .error-exists = ❌ Показання за { $date } вже введені.
  .cancelled = ❌ Створення скасовано.
  .error-value-lower = ❌ Введіть число більше або рівне попередньому показанню ({ $prev }).
  .ask-zone-value = Введіть показання для зони "{ $zone }" (попереднє: { $prev }):
  .success = ✅ Показання збережено.
  .consumption = Споживання
  .error = ❌ Помилка при збереженні показань.

create-tariff =
  .ask-date = 📅 Оберіть місяць початку дії тарифу ({ $year }):
  .ask-price = Введіть ціну ({ $curr }/{ $unit }):
  .ask-price-day = Введіть ціну для Дня ({ $curr }/{ $unit }):
  .ask-price-peak = Введіть ціну для Піку ({ $curr }/{ $unit }):
  .cancelled = ❌ Створення скасовано.
  .ask-price-night = Введіть ціну для Ночі ({ $curr }/{ $unit }):
  .ask-price-half-peak = Введіть ціну для Напівпіку ({ $curr }/{ $unit }):
  .success = ✅ Тариф додано:
    { $zones }
  .error = ❌ Помилка при збереженні тарифу.

create-fixed-fee =
  .ask-date = 📅 Оберіть місяць початку дії абонплати ({ $year }):
  .ask-amount = Введіть суму абонплати ({ $currency }):
  .cancelled = ❌ Створення скасовано.
  .success = ✅ Абонплату додано: { $amount } { $currency }
  .error = ❌ Помилка при збереженні.

change-currency =
  .ask = Поточна валюта: { $current }
    Оберіть нову валюту:
  .cancelled = ❌ Зміну валюти скасовано.
  .success = ✅ Валюту успішно змінено на { $currency }.
  .error = ❌ Помилка при оновленні валюти.

change-unit =
  .ask = Поточна одиниця виміру: { $current }
    Оберіть нову:
  .cancelled = ❌ Зміну скасовано.
  .success = ✅ Одиницю виміру змінено на { $unit }.
  .error = ❌ Помилка при оновленні.

delete-account =
  .error-no-id = ❌ Помилка: не вдалося визначити рахунок для видалення.
  .error-not-found = ❌ Помилка: не вдалося знайти рахунок в БД для видалення.
  .confirm = Ви впевнені, що хочете видалити рахунок { $account }?
  .cancelled = ❌ Видалення скасовано.
  .success = ✅ Рахунок та всі пов'язані дані успішно видалено.

delete-address =
  .error-no-id = ❌ Помилка: не вдалося визначити адресу для видалення.
  .error-not-found = ❌ Помилка: не вдалося знайти адресу в БД для видалення.
  .confirm = Ви впевнені, що хочете видалити адресу { $address }?
  .confirm-unlink = Ви впевнені, що хочете відв'язати адресу { $address } від свого профілю?
  .cancelled = ❌ Видалення скасовано.
  .success-all = ✅ Адресу та всі пов'язані дані успішно видалено.
  .success-unlinked = ✅ Адресу відв'язано від вашого профілю.
  .error = ❌ Помилка при видаленні адреси.

delete-reading =
  .error-no-id = ❌ Помилка: не вдалося визначити показання для видалення.
  .error-not-found = ❌ Помилка: не вдалося знайти показання в БД для видалення.
  .confirm = Ви впевнені, що хочете видалити показання за { $date }?
  .cancelled = ❌ Видалення скасовано.
  .success = ✅ Показання успішно видалено.

delete-tariff =
  .error-no-id = ❌ Помилка: не вдалося визначити тариф для видалення.
  .error-not-found = ❌ Помилка: не вдалося знайти тариф в БД для видалення.
  .confirm = Ви впевнені, що хочете видалити тариф { $type }?
  .cancelled = ❌ Видалення скасовано.
  .success = ✅ Тариф успішно видалено.

delete-fixed-fee =
  .confirm = Видалити абонплату { $amount }?
  .cancelled = ❌ Скасовано.
  .success = ✅ Видалено.

calculate-bill =
  .error-no-id = ❌ Помилка: не вказано ID рахунку або адреси.
  .ask-month = 📅 Оберіть місяць для розрахунку ({ $year }):
  .ask-month-address = 📅 Оберіть місяць для розрахунку по всім рахункам адреси ({ $year }):
  .ask-month-year = 📅 Оберіть місяць для розрахунку ({ $year }):
  .error-no-accounts = ❌ За цією адресою немає рахунків.
  .bill-header = 🧾 Розрахунок по рахунку <b>{ $account }</b> за <b>{ $date }</b>
  .total = <b>РАЗОМ ДО СПЛАТИ: { $amount }</b>
  .summary-header = 🧾 Зведений розрахунок за <b>{ $date }</b>
  .account-header = <b>Рахунок { $account } ({ $emoji })</b>
  .account-total =   - <b>Підсумок по рахунку: { $amount }</b>
  .grand-total = <b>💰 ЗАГАЛЬНИЙ ПІДСУМОК: { $amount }</b>
  .error-readings-not-found = Показання не знайдено
  .error-prev-readings-not-found = Не знайдено показання за попередній місяць ({ $date })
  .error-tariff-not-found = Не знайдено діючий тариф
  .error-negative-consumption = Від'ємне споживання для зони "{ $zone }"
  .line-zone =   - Зона "{ $zone }": { $consumption } { $unit } x { $price } = <b>{ $cost }</b>
  .line-fixed-fee =   - ➕ Абонплата: <b>{ $amount }</b>

broadcast =
  .error-no-text = ❌ Будь ласка, введіть текст повідомлення.
  .start = 🚀 Починаю розсилку для { $count } користувачів...
  .report = ✅ Розсилка завершена.
    Успішно: { $success }
    Помилок: { $failure }

transfer-address =
  .ask-id = 🆔 Введіть Telegram ID нового власника:
  .error-invalid-id = ❌ Некоректний ID. Введіть число.
  .error-user-not-found = ❌ Користувача з таким ID не знайдено в базі бота. Попросіть його спочатку запустити бота.
  .error-self-transfer = ❌ Ви не можете передати адресу самому собі.
  .confirm = Ви впевнені, що хочете передати права на адресу <b>{ $address }</b> користувачеві <b>{ $user }</b>?
  .cancelled = ❌ Передача прав скасована.
  .success = ✅ Права на адресу успішно передано.
  .error = ❌ Помилка при передачі прав.

kick-user =
  .confirm = Ви впевнені, що хочете виключити користувача <b>{ $user }</b> з адреси <b>{ $address }</b>?
  .success = ✅ Користувача виключено.
  .error = ❌ Помилка при виключенні користувача.

invite =
  .success = ✅ Ви успішно приєдналися до адреси <b>{ $address }</b>.
  .already-member = ⚠️ Ви вже є користувачем адреси <b>{ $address }</b>.
  .not-found = ❌ Адресу не знайдено.
  .error = ❌ Помилка при приєднанні до адреси.
  .request-sent = ✅ Заявку на вступ до адреси <b>{ $address }</b> надіслано власнику.
  .owner-notification = 👤 Користувач <b>{ $user }</b> хоче приєднатися до адреси <b>{ $address }</b>.
  .approved-user = ✅ Вашу заявку на вступ до адреси <b>{ $address }</b> схвалено!
  .rejected-user = ❌ Вашу заявку на вступ до адреси <b>{ $address }</b> відхилено.
  .approved-owner = ✅ Ви схвалили заявку користувача <b>{ $user }</b>.
  .rejected-owner = ❌ Ви відхилили заявку користувача <b>{ $user }</b>.

create-reminder =
  .ask-title = Введіть назву нагадування:
  .ask-day = Введіть день місяця (1-31), для останнього дня місяця введіть 31:
  .ask-time = Введіть час (ГГ:ХХ):
  .error-text = ❌ Будь ласка, введіть текст.
  .error-day = ❌ Введіть коректний день (число від 1 до 31).
  .error-time = ❌ Введіть час у форматі ГГ:ХХ (наприклад, 10:00).
  .success = ✅ Нагадування створено!
  .error = ❌ Помилка при створенні.
  .cancelled = ❌ Створення скасовано.

delete-reminder =
  .confirm = Видалити нагадування <b>{ $title }</b>?
  .success = ✅ Нагадування видалено.
  .cancelled = ❌ Видалення скасовано.

set-timezone =
  .ask = Оберіть ваш часовий пояс зі списку або надішліть геолокацію:
  .send-location = Будь ласка, натисніть кнопку нижче або надішліть геолокацію через скріпку 📎, щоб визначити часовий пояс автоматично.
  .error-invalid = ❌ Некоректний часовий пояс.
  .success = ✅ Часовий пояс встановлено: <b>{ $timezone }</b>.
  .cancelled = ❌ Скасовано.
reminder =
  .message = 🔔 <b>Нагадування!</b>
    Настав час внести показання лічильників.
    У вас є рахунки без показань за цей місяць: <b>{ $count }</b>.