start-message = Hello! I am a bot.
help-message =
  This is a help message.
  Available commands: /start, /help
menu =
  .not-found = ❌ Menu not found
  .title = 🤖 <b>Choose a command:</b>

scene =
  .action-canceled = ❌ Action aborted

command =
  .reloading = ♻️ Reloading command...
  .unload = ♻️ Unloading command...
  .load = ♻️ Unloaded. Loading command...
  .reloaded = ♻️ Command reloaded!

main-menu =
  .not-found = ❌ Main menu not found
  .title = 👋 Hello! Select an action:
  .button-ping = 🏓 Ping
  .button-whoami = 👤 Who am I
  .button-myid = 🆔 My ID
  .button-commands = 🤖 Commands
utilities-menu =
  .title = ⚙️ Utilities
account-menu =
  .title = Account menu #
address-menu =
  .title = 📋 Accounts at <b>{ $address }</b>
  .owner-details =
    #️⃣ <b>ID:</b> <code>{ $id }</code>
    🔗 <b>Invite Link:</b>
    <code>{ $link }</code>
    
    ℹ️ <i>To share an address, give this ID or Link to another user.</i>

    ℹ️ <i> To delete this address, first delete all accounts in it.</i>
readings-menu =
  .title = 📊 Meter readings for <b>{ $year }</b>
  .consumption = Consumption
reading-menu =
  .title = 📊 Meter reading
  .reading-for = 📊 Meter reading for
fixed-fee-menu =
  .title = 📌 Subscription fee
  💰 Amount: { $amount }
  📆 Start date: { $startDate }
address-users-menu =
  .title = 👥 Address users <b>{ $address }</b>
address-user-menu =
  .title = 👤 User: <b>{ $user }</b>
reminders-menu =
  .title = ⏰ Your reminders (Timezone: <b>{ $timezone }</b>)
reminder-menu =
  .title = ⏰ Reminder: <b>{ $title }</b>
    📅 Day: <b>{ $day }</b>
    🔔 Status: <b>{ $status }</b>

reminder =
  .enabled = Enabled
  .disabled = Disabled
  .message = 🔔 <b>Reminder!</b>
    It's time to submit your meter readings.
    You have accounts without readings for this month: <b>{ $count }</b>.

## Buttons
button =
  .create-address = ➕ Create address
  .close = ❌ Close
  .change-language = 🌐 Language / Мова
  .back = ⬅️ Back
  .delete = 🗑️ Delete
  .cancel = ❌ Cancel
  .tariffs = 💲 Tariffs
  .readings = 📊 Meter readings
  .delete-account = 🗑️ Delete account
  .account = Account #
  .create-account = ➕ Add account
  .delete-address = 🗑️ Delete address
  .create-reading = ➕ Add reading
  .delete-reading = 🗑️ Delete reading
  .create-tariff = ➕ Add tariff
  .delete-tariff = 🗑️ Delete tariff
  .home = 🏠 Home
  .add-more = ➕ Add more
  .subscription-fee = 💰 Subscription fee
  .currency = 💱 Currency
  .unit = 📏 Unit
  .calculate-bill = 🧾 Calculate bill
  .calculate-all-bills = 🧾 Calculate all bills
  .fixed-fees = 💰 Subscription fees / Fixed fees
  .create-fixed-fee = ➕ Add fixed fee
  .unlink-address = 🔗 Unlink address
  .transfer-address = 👑 Transfer ownership

error =
  .admin-only = ❌ This command is available only for administrators.
  .owner-only = ❌ This command is available only for the bot owner.
  .command-failed = ❌ Error executing command.
  .command-not-found = ❌ Command { $name } not found.
  .command-path-not-found = ❌ Failed to reload command: path to file not found.
  .command-reload-failed = ❌ Failed to reload command.
  .reading-not-found = ❌ Meter reading not found
  .no-account-id = ❌ Error: account ID not specified.
  .account-not-found = ❌ Account not found.
  .no-telegram-id = ❌ Error: could not get your Telegram ID.
  .invalid-number = ❌ Enter a valid number.
  .not-found = ❌ Record not found.
  .address-not-found = ❌ Address { $id } not found.

items-count = { $count ->
  [one] { $count } item
  *[other] { $count } items
}

units =
  .electricity = kWh
  .water = gal
  .gas = ft³

language-select-title = 🌐 Select language:
language-selected = ✅ Language successfully changed!

resource =
  .electricity = ⚡ Electricity
  .heating = 🌡️ Heating
  .water = 💧 Water
  .gas = 🔥 Gas
  .internet = 🌐 Internet
  .garbage = 🗑️ Garbage
  .other = 📦 Other

meter-type =
  .single = Single-rate
  .day-night = Day/Night
  .multi-zone = Multi-zone

create-account =
  .ask-resource = Select resource type:
  .cancelled = ❌ Account creation cancelled.
  .ask-meter-type = Select meter type:
  .ask-unit = Select unit for { $emoji } { $resource }:
  .ask-currency = Select currency:
  .ask-number = Currency: { $currency }. Enter account number:
  .ask-number-text = Enter account number as text:
  .success = ✅ Account { $account } ({ $emoji } { $resource }{ $meter }) successfully added.
  .meter-label = meter
  .error = ❌ Error creating account.

create-address =
  .ask = Enter a descriprive address in string format
  .cancelled = ❌ Address creation cancelled.
  .error-text-required = ❌ Please enter address as text.
  .success = ✅ Address 🏠 { $address } successfully added.
  .error = ❌ Error adding address.
  .already-exists = ❌ Address { $address } already exists in your addresses.

create-reading =
  .ask-date = 📅 Select month for readings ({ $year }):
  .error-exists = ❌ Readings for { $date } already exist.
  .cancelled = ❌ Creation cancelled.
  .error-value-lower = ❌ Enter a value greater than or equal to previous reading ({ $prev }).
  .ask-zone-value = Enter reading for zone "{ $zone }" (previous: { $prev }):
  .success = ✅ Readings saved.
  .consumption = Consumption
  .error = ❌ Error saving readings.

create-tariff =
  .ask-date = 📅 Select tariff start month ({ $year }):
  .ask-price = Enter price ({ $curr }/{ $unit }):
  .ask-price-day = Enter Day price ({ $curr }/{ $unit }):
  .ask-price-peak = Enter Peak price ({ $curr }/{ $unit }):
  .cancelled = ❌ Creation cancelled.
  .ask-price-night = Enter Night price ({ $curr }/{ $unit }):
  .ask-price-half-peak = Enter Half-peak price ({ $curr }/{ $unit }):
  .success = ✅ Tariff added:
    { $zones }
  .error = ❌ Error saving tariff.

create-fixed-fee =
  .ask-date = 📅 Select fee start month ({ $year }):
  .ask-amount = Enter fee amount ({ $currency }):
  .cancelled = ❌ Creation cancelled.
  .success = ✅ Fixed fee added: { $amount } { $currency }
  .error = ❌ Error saving fee.

change-currency =
  .ask = Current currency: { $current }
    Select new currency:
  .cancelled = ❌ Currency change cancelled.
  .success = ✅ Currency successfully changed to { $currency }.
  .error = ❌ Error updating currency.

change-unit =
  .ask = Current unit: { $current }
    Select new unit:
  .cancelled = ❌ Change cancelled.
  .success = ✅ Unit successfully changed to { $unit }.
  .error = ❌ Error updating.

delete-account =
  .error-no-id = ❌ Error: could not determine account to delete.
  .error-not-found = ❌ Error: account not found in DB.
  .confirm = Are you sure you want to delete account { $account }?
  .cancelled = ❌ Deletion cancelled.
  .success = ✅ Account and all related data successfully deleted.

delete-address =
  .error-no-id = ❌ Error: could not determine address to delete.
  .error-not-found = ❌ Error: address not found in DB.
  .confirm = Are you sure you want to delete address { $address }?
  .confirm-unlink = Are you sure you want to unlink address { $address } from your profile?
  .cancelled = ❌ Deletion cancelled.
  .success-all = ✅ Address and all related data successfully deleted.
  .success-unlinked = ✅ Address unlinked from your profile.
  .error = ❌ Error deleting address.

delete-reading =
  .error-no-id = ❌ Error: could not determine reading to delete.
  .error-not-found = ❌ Error: reading not found in DB.
  .confirm = Are you sure you want to delete readings for { $date }?
  .cancelled = ❌ Deletion cancelled.
  .success = ✅ Readings successfully deleted.

delete-tariff =
  .error-no-id = ❌ Error: could not determine tariff to delete.
  .error-not-found = ❌ Error: tariff not found in DB.
  .confirm = Are you sure you want to delete tariff { $type }?
  .cancelled = ❌ Deletion cancelled.
  .success = ✅ Tariff successfully deleted.

delete-fixed-fee =
  .confirm = Delete fixed fee { $amount }?
  .cancelled = ❌ Cancelled.
  .success = ✅ Deleted.

calculate-bill =
  .error-no-id = ❌ Error: account or address ID not specified.
  .ask-month = 📅 Select month for calculation ({ $year }):
  .ask-month-address = 📅 Select month for calculation for all accounts ({ $year }):
  .ask-month-year = 📅 Select month for calculation ({ $year }):
  .error-no-accounts = ❌ No accounts found for this address.
  .bill-header = 🧾 Bill for account <b>{ $account }</b> for <b>{ $date }</b>
  .total = <b>TOTAL TO PAY: { $amount }</b>
  .summary-header = 🧾 Summary bill for <b>{ $date }</b>
  .account-header = <b>Account { $account } ({ $emoji })</b>
  .account-total =   - <b>Account total: { $amount }</b>
  .grand-total = <b>💰 GRAND TOTAL: { $amount }</b>
  .error-readings-not-found = Readings not found
  .error-prev-readings-not-found = Previous readings not found ({ $date })
  .error-tariff-not-found = Active tariff not found
  .error-negative-consumption = Negative consumption for zone "{ $zone }"
  .line-zone =   - Zone "{ $zone }": { $consumption } { $unit } x { $price } = <b>{ $cost }</b>
  .line-fixed-fee =   - ➕ Fixed fee: <b>{ $amount }</b>

broadcast =
  .error-no-text = ❌ Please provide a message to broadcast.
  .start = 🚀 Starting broadcast to { $count } users...
  .report = ✅ Broadcast finished.
    Success: { $success }
    Failed: { $failure }

transfer-address =
  .ask-id = 🆔 Enter the Telegram ID of the new owner:
  .error-invalid-id = ❌ Invalid ID. Please enter a number.
  .error-user-not-found = ❌ User with this ID not found in the bot database. Ask them to start the bot first.
  .error-self-transfer = ❌ You cannot transfer the address to yourself.
  .confirm = Are you sure you want to transfer ownership of address <b>{ $address }</b> to user <b>{ $user }</b>?
  .cancelled = ❌ Transfer cancelled.
  .success = ✅ Ownership successfully transferred.
  .error = ❌ Error transferring ownership.

kick-user =
  .confirm = Are you sure you want to kick user <b>{ $user }</b> from address <b>{ $address }</b>?
  .success = ✅ User kicked.
  .error = ❌ Error kicking user.

invite =
  .success = ✅ You have successfully joined the address <b>{ $address }</b>.
  .already-member = ⚠️ You are already a member of address <b>{ $address }</b>.
  .not-found = ❌ Address not found.
  .error = ❌ Error joining address.
  .request-sent = ✅ Request to join address <b>{ $address }</b> sent to the owner.
  .owner-notification = 👤 User <b>{ $user }</b> wants to join address <b>{ $address }</b>.
  .approved-user = ✅ Your request to join address <b>{ $address }</b> has been approved!
  .rejected-user = ❌ Your request to join address <b>{ $address }</b> has been rejected.
  .approved-owner = ✅ You approved the request from user <b>{ $user }</b>.
  .rejected-owner = ❌ You rejected the request from user <b>{ $user }</b>.

create-reminder =
  .ask-title = Enter reminder title:
  .ask-day = Enter day of month (1-31):
  .ask-time = Enter time (HH:MM):
  .error-text = ❌ Please enter text.
  .error-day = ❌ Enter a valid day (number 1-31).
  .error-time = ❌ Enter time in HH:MM format (e.g. 10:00).
  .success = ✅ Reminder created!
  .error = ❌ Error creating reminder.
  .cancelled = ❌ Creation cancelled.

delete-reminder =
  .confirm = Delete reminder <b>{ $title }</b>?
  .success = ✅ Reminder deleted.
  .cancelled = ❌ Deletion cancelled.

set-timezone =
  .ask = Enter your timezone (e.g. Europe/Kyiv), select from list or send location:
  .send-location = Please press the button below or send location via attachment 📎 to detect timezone automatically.
  .error-invalid = ❌ Invalid timezone.
  .success = ✅ Timezone set to: <b>{ $timezone }</b>.
  .cancelled = ❌ Cancelled.
reminder =
  .message = 🔔 <b>Reminder!</b>
    It's time to submit your meter readings.
    You have accounts without readings for this month: <b>{ $count }</b>.