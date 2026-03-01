start-message = Hello! I am a bot.
help-message =
  This is a help message.
  Available commands: /start, /help
menu =
  .not-found = ❌ Menu not found
  .title = 🤖 **Choose a command:**

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
  .title = 📋 Accounts by address
readings-menu =
  .title = 📊 Meter readings for { $year }
  .consumption = Consumption
reading-menu =
  .title = 📊 Meter reading
  .reading-for = 📊 Meter reading for

## Buttons
button =
  .create-address = ➕ Create address
  .close = ❌ Close
  .change-language = 🌐 Language / Мова
  .back = ⬅️ Back
  .delete = 🗑️ Delete
  .cancel = ❌ Cancel
  .tariffs = 💲 Tariffs
  .calculate-bill = 🧾 Calculate bill
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

error =
  .admin-only = ❌ This command is available only for administrators.
  .owner-only = ❌ This command is available only for the bot owner.
  .command-failed = ❌ Error executing command.
  .command-not-found = ❌ Command { $name } not found.
  .command-path-not-found = ❌ Failed to reload command: path to file not found.
  .command-reload-failed = ❌ Failed to reload command.
  .reading-not-found = ❌ Meter reading not found

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