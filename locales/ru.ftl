start-message = Привет! Я бот.
help-message =
  Это справочное сообщение.
  Доступные команды: /start, /help
menu =
  .not-found = ❌ Меню не найдено
  .title = 🤖 <b>Выберите команду:</b>

scene =
  .action-canceled = ❌ Действие отменено

command =
  .reloading = ♻️ Перезагрузка команды...
  .unload = ♻️ Выгружаю команду...
  .load = ♻️ Выгружено. Загружаю команду...
  .reloaded = ♻️ Команда перезагружена!

main-menu =
  .not-found = ❌ Главное меню не найдено
  .title = 🏠 Вы в меню коммунальных услуг. Выберите действие:
  .button-ping = 🏓 Пинг
  .button-whoami = 👤 Обо мне
  .button-myid = 🆔 Мой айди
  .button-stats = 📊 Статистика
  .button-version = ℹ️ Версия
account-menu =
  .title = Меню счёта №
address-menu =
  .title = 📋 Счета по адресу <b>{ $address }</b>
  .owner-details =
    🔗 <b>Ссылка-приглашение:</b>
    <code>{ $link }</code>
    
    ℹ️ <i>Чтобы поделиться адресом, передайте эту ссылку другому пользователю.</i>
  .delete-info = ℹ️ <i>Чтобы удалить этот адрес, сначала удалите в нём все счета.</i>
readings-menu =
  .title = 📊 Показания за <b>{ $year }</b> год
  .consumption = Потребление
reading-menu =
  .title = 📊 Показание
  .reading-for = 📊 Показание за
fixed-fee-menu =
  .title = 📌 Абонплата
  💰 Сумма: { $amount }
  📆 Начало действия: { $startDate }
address-users-menu =
  .title = 👥 Пользователи адреса <b>{ $address }</b>
address-user-menu =
  .title = 👤 Пользователь: <b>{ $user }</b>
reminders-menu =
  .title = ⏰ Ваши напоминания (Часовой пояс: <b>{ $timezone }</b>)
reminder-menu =
  .title = ⏰ Напоминание: <b>{ $title }</b>
    📅 День: <b>{ $day }</b>
    🔔 Статус: <b>{ $status }</b>

reminder =
  .enabled = Включено
  .disabled = Выключено
  .message = 🔔 <b>Напоминание!</b>
    Пришло время внести показания счетчиков.
    У вас есть счета без показаний за этот месяц: <b>{ $count }</b>.

## Buttons
button =
  .account = Счёт №
  .add-more = ➕ Добавить еще
  .back = ⬅️ Назад
  .calculate-all-bills = 🧾 Рассчитать все счета
  .calculate-bill = 🧾 Рассчитать счет
  .cancel = ❌ Отменить
  .change-language = 🌐 Язык / Language
  .close = ❌ Закрыть
  .create-account = ➕ Добавить счёт
  .create-address = ➕ Создать адрес
  .create-fixed-fee = ➕ Добавить абонплату
  .create-reading = ➕ Добавить показание
  .create-tariff = ➕ Добавить тариф
  .currency = 💱 Валюта
  .delete = 🗑️ Удалить
  .delete-account = 🗑️ Удалить счёт
  .delete-address = 🗑️ Удалить адрес
  .delete-reading = 🗑️ Удалить показание
  .delete-tariff = 🗑️ Удалить тариф
  .fixed-fees = 💰 Абонплата / Фиксированные платежи
  .home = 🏠 Домой
  .readings = 📊 Показания
  .tariffs = 💲 Тарифы
  .unit = 📏 Единица изм.
  .unlink-address = 🔗 Отвязать адрес
  .transfer-address = 👑 Передать права
  .address-users = 👥 Пользователи
  .kick-user = 🚫 Исключить
  .approve = ✅ Принять
  .reject = ❌ Отклонить
  .reminders = ⏰ Напоминания
  .create-reminder = ➕ Добавить напоминание
  .enable = 🔔 Включить
  .disable = 🔕 Выключить
  .set-timezone = 🌍 Часовой пояс
  .location = По геолокации
  .send-location = 📍 Отправить местоположение

error =
  .admin-only = ❌ Эта команда доступна только администраторам.
  .owner-only = ❌ Эта команда доступна только владельцу бота.
  .command-failed = ❌ Ошибка при выполнении команды.
  .command-not-found = ❌ Команда { $name } не найдена.
  .command-path-not-found = ❌ Не удалось перезагрузить команду: путь к файлу не найден.
  .command-reload-failed = ❌ Не удалось перезагрузить команду.
  .reading-not-found = ❌ Показание не найдено
  .no-account-id = ❌ Ошибка: не указан ID счета.
  .account-not-found = ❌ Счет не найден.
  .no-telegram-id = ❌ Ошибка: не удалось получить ваш Telegram ID.
  .invalid-number = ❌ Введите корректное число.
  .not-found = ❌ Запись не найдена.
  .address-not-found = ❌ Адрес { $id } не найден.

items-count = { $count ->
  [one] { $count } товар
  [few] { $count } товара
  *[many] { $count } товаров
}

units =
  .electricity = кВт·ч
  .water = м³
  .gas = м³

unit =
  .kwh = кВт·ч
  .kwh_alt = kWh
  .m3 = м³
  .l = л
  .gal = гал
  .ft3 = ft³
  .gcal = Гкал
  .gj = ГДж
  .mwh = МВт·ч
  .month = мес.
  .day = день
  .person = чел.
  .m2 = м²
  .unit = ед.
  .piece = шт.
  .service = услуга
  .therm = терм

language-select-title = 🌐 Выберите язык:
language-selected = ✅ Язык успешно изменен!

resource =
  .electricity = ⚡ Электричество
  .heating = 🌡️ Отопление
  .water = 💧 Вода
  .gas = 🔥 Газ
  .internet = 🌐 Интернет
  .garbage = 🗑️ Мусор
  .other = 📦 Другое
  .rent = 🏠 Квартплата

meter-type =
  .single = Однотарифный
  .day-night = День/Ночь
  .multi-zone = Многозонный

create-account =
  .ask-resource = Выберите тип ресурса:
  .cancelled = ❌ Создание счёта отменено.
  .ask-persons = 👥 Введите количество человек:
  .ask-area = 🏙️ Введите площадь в м²:
  .ask-meter-type = Выберите тип счётчика:
  .ask-unit = Выберите единицу измерения для { $emoji } { $resource }:
  .ask-currency = Выберите валюту:
  .ask-number = Валюта: { $currency }. Введите номер счёта:
  .ask-number-text = Введите номер счёта текстом:
  .success = ✅ Счёт { $account } ({ $emoji } { $resource }{ $meter }) успешно добавлен.
  .meter-label = счётчик
  .error = ❌ Ошибка при создании счёта.

create-address =
  .ask = Введите понятное название строкой
  .cancelled = ❌ Создание адреса отменено.
  .error-text-required = ❌ Пожалуйста, введите адрес строкой.
  .success = ✅ Адрес 🏠 { $address } успешно добавлен.
  .error = ❌ Ошибка при добавлении адреса.
  .already-exists = ❌ Адрес { $address } уже есть в ваших адресах.

create-reading =
  .ask-date = 📅 Выберите месяц для ввода показаний ({ $year }):
  .error-exists = ❌ Показания за { $date } уже введены.
  .cancelled = ❌ Создание отменено.
  .error-value-lower = ❌ Введите число больше или равное предыдущему показанию ({ $prev }).
  .ask-zone-value-with-date = Введите показания для зоны "{ $zone }" (предыдущее за { $prevDate }: { $prev }):
  .ask-zone-value = Введите показания для зоны "{ $zone }" (предыдущее: { $prev }):
  .success = ✅ Показания сохранены.
  .consumption = Потребление
  .error = ❌ Ошибка при сохранении показаний.

create-tariff =
  .ask-date = 📅 Выберите месяц начала действия тарифа ({ $year }):
  .ask-price = Введите цену ({ $curr }/{ $unit }):
  .ask-price-day = Введите цену для Дня ({ $curr }/{ $unit }):
  .ask-price-peak = Введите цену для Пика ({ $curr }/{ $unit }):
  .cancelled = ❌ Создание отменено.
  .ask-price-night = Введите цену для Ночи ({ $curr }/{ $unit }):
  .ask-price-half-peak = Введите цену для Полупика ({ $curr }/{ $unit }):
  .success = ✅ Тариф добавлен:
    { $zones }
  .error = ❌ Ошибка при сохранении тарифа.

create-fixed-fee =
  .ask-date = 📅 Выберите месяц начала действия абонплаты ({ $year }):
  .ask-amount = Введите сумму абонплаты ({ $currency }):
  .cancelled = ❌ Создание отменено.
  .success = ✅ Абонплата добавлена: { $amount } { $currency }
  .error = ❌ Ошибка при сохранении.

change-currency =
  .ask = ℹ️ Текущая валюта: { $current }
    Выберите новую валюту:
  .cancelled = ❌ Изменение валюты отменено.
  .success = ✅ Валюта успешно изменена на { $currency }.
  .error = ❌ Ошибка при обновлении валюты.

change-unit =
  .ask = ℹ️ Текущая единица измерения: { $current }
    Выберите новую:
  .cancelled = ❌ Изменение отменено.
  .success = ✅ Единица измерения изменена на { $unit }.
  .error = ❌ Ошибка при обновлении.

delete-account =
  .error-no-id = ❌ Ошибка: не удалось определить счёт для удаления.
  .error-not-found = ❌ Ошибка: не удалось найти счёт в БД для удаления.
  .confirm = ⚠️ Вы уверены, что хотите удалить счёт { $account }?
  .cancelled = ❌ Удаление отменено.
  .success = ✅ Счёт { $account } и все связанные данные успешно удалены.

delete-address =
  .error-no-id = ❌ Ошибка: не удалось определить адрес для удаления.
  .error-not-found = ❌ Ошибка: не удалось найти адрес в БД для удаления.
  .confirm = ⚠️ Вы уверены, что хотите удалить адрес { $address }?
  .confirm-unlink = ⚠️ Вы уверены, что хотите отвязать адрес { $address } от своего профиля?
  .cancelled = ❌ Удаление отменено.
  .success-all = ✅ Адрес { $address } и все связанные данные успешно удалены.
  .success-unlinked = ✅ Адрес { $address } отвязан от вашего профиля.
  .error = ❌ Ошибка при удалении адреса { $address }.

delete-reading =
  .error-no-id = ❌ Ошибка: не удалось определить показание для удаления.
  .error-not-found = ❌ Ошибка: не удалось найти показания в БД для удаления.
  .confirm = ⚠️ Вы уверены, что хотите удалить показания за { $date }?
  .cancelled = ❌ Удаление отменено.
  .success = ✅ Показания за { $date } успешно удалены.

delete-tariff =
  .error-no-id = ❌ Ошибка: не удалось определить тариф для удаления.
  .error-not-found = ❌ Ошибка: не удалось найти тариф в БД для удаления.
  .confirm = ⚠️ Вы уверены, что хотите удалить тариф { $type }?
  .cancelled = ❌ Удаление отменено.
  .success = ✅ Тариф { $type } успешно удалён.
  .error = ❌ Ошибка при удалении тарифа { $type }.

delete-fixed-fee =
  .confirm = ⚠️ Удалить абонплату { $amount }?
  .cancelled = ❌ Отменено.
  .success = ✅ Удалено.

calculate-bill =
  .error-no-id = ❌ Ошибка: не указан ID счета или адреса.
  .ask-month = 📅 Выберите месяц для расчета ({ $year }):
  .ask-month-address = 📅 Выберите месяц для расчета по всем счетам адреса ({ $year }):
  .ask-month-year = 📅 Выберите месяц для расчета ({ $year }):
  .error-no-accounts = ❌ По этому адресу нет счетов.
  .bill-header = 🧾 Расчет по счету <b>{ $account }</b> за <b>{ $date }</b>
  .total = <b>ИТОГО К ОПЛАТЕ: { $amount } { $currency }</b>
  .summary-header = 🧾 Сводный расчет за <b>{ $date }</b>
  .account-header = <b>Счет { $account } ({ $emoji })</b>
  .account-total =   - <b>Итог по счету: { $amount } { $currency }</b>
  .grand-total = <b>💰 ОБЩИЙ ИТОГ: { $amount } { $currency }</b>
  .error-readings-not-found = Показания не найдены
  .error-prev-readings-not-found = Не найдены показания за предыдущий месяц ({ $date })
  .error-tariff-not-found = Не найден действующий тариф
  .error-no-area = ❌ Не указана площадь для этого счёта.
  .error-tariff-zone-not-found = ❌ Не найдена тарифная зона.
  .error-negative-consumption = Отрицательное потребление для зоны "{ $zone }"
  .error-no-persons = ❌ Не указано количество человек для этого счёта.
  .line-zone =   - Зона "{ $zone }": { $consumption } { $unit } x { $price } = <b>{ $cost }</b>
  .line-area =   - Площадь: { $area } { $unit } × { $price } = <b>{ $cost }</b>
  .line-persons = - Кол-во человек: { $persons } { $unit } × { $price } = <b>{ $cost }</b>
  .line-unit-service = - Услуга: { $quantity } { $unit } × { $price } = <b>{ $cost }</b>
  .line-internet = - Интернет: { $consumption } { $unit } × { $price } = <b>{ $cost }</b>
  .line-fixed-fee =   - ➕ Абонплата: <b>{ $amount }</b>

broadcast =
  .error-no-text = ❌ Пожалуйста, введите текст сообщения.
  .start = 🚀 Начинаю рассылку для { $count } пользователей...
  .report = ✅ Рассылка завершена.
    Успешно: { $success }
    Ошибок: { $failure }

transfer-address =
  .error-user-not-found = ❌ Пользователь с таким ID не найден в базе бота. Попросите его сначала запустить бота.
  .confirm = ⚠️ Вы уверены, что хотите передать права на адрес <b>{ $address }</b> пользователю <b>{ $user }</b>?
  .cancelled = ❌ Передача прав отменена.
  .success = ✅ Права на адрес <b>{ $address }</b> успешно переданы пользователю <b>{ $user }</b>.
  .error = ❌ Ошибка при передаче прав на адрес <b>{ $address }</b> пользователю <b>{ $user }</b>.

kick-user =
  .confirm = ⚠️ Вы уверены, что хотите исключить пользователя <b>{ $user }</b> из адреса <b>{ $address }</b>?
  .success = ✅ Пользователь <b>{ $user }</b> исключен из адреса <b>{ $address }</b>.
  .error = ❌ Ошибка при исключении пользователя <b>{ $user }</b> из адреса <b>{ $address }</b>.
  .cancelled = ❌ Исключение пользователя <b>{ $user }</b> из адреса <b>{ $address }</b> отменено.

invite =
  .success = ✅ Вы успешно присоединились к адресу <b>{ $address }</b>.
  .already-member = ⚠️ Вы уже являетесь пользователем адреса <b>{ $address }</b>.
  .not-found = ❌ Адрес не найден.
  .error = ❌ Ошибка при присоединении к адресу.
  .request-sent = ✅ Заявка на вступление в адрес <b>{ $address }</b> отправлена владельцу.
  .owner-notification = 👤 Пользователь <b>{ $user }</b> хочет присоединиться к адресу <b>{ $address }</b>.
  .approved-user = ✅ Ваша заявка на вступление в адрес <b>{ $address }</b> одобрена!
  .rejected-user = ❌ Ваша заявка на вступление в адрес <b>{ $address }</b> отклонена.
  .approved-owner = ✅ Вы одобрили заявку пользователя <b>{ $user }</b>.
  .rejected-owner = ❌ Вы отклонили заявку пользователя <b>{ $user }</b>.

create-reminder =
  .ask-title = Введите название напоминания:
  .ask-day = Введите день месяца (1-31), для последнего дня месяца введите 31:
  .ask-time = Введите время (ЧЧ:ММ):
  .error-text = ❌ Пожалуйста, введите текст.
  .error-day = ❌ Введите корректный день (число от 1 до 31).
  .error-time = ❌ Введите время в формате ЧЧ:ММ (например, 10:00).
  .success = ✅ Напоминание создано!
  .error = ❌ Ошибка при создании.
  .cancelled = ❌ Создание отменено.

delete-reminder =
  .confirm = Удалить напоминание <b>{ $title }</b>?
  .success = ✅ Напоминание <b>{ $title }</b> удалено.
  .cancelled = ❌ Удаление отменено.
  .error = ❌ Ошибка при удалении напоминания <b>{ $title }</b>.

set-timezone =
  .ask = Выберите ваш часовой пояс из списка или отправьте геолокацию:
  .send-location = Пожалуйста, нажмите кнопку ниже или отправьте геолокацию через скрепку 📎, чтобы определить часовой пояс автоматически.
  .error-invalid = ❌ Некорректный часовой пояс.
  .success = ✅ Часовой пояс установлен: <b>{ $timezone }</b>.
  .cancelled = ❌ Отменено.
reminder =
  .message = 🔔 <b>Напоминание!</b>
    Пришло время внести показания счетчиков.
    У вас есть счета без показаний за этот месяц: <b>{ $count }</b>.