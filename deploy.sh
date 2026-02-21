#!/bin/bash

# Получаем имя текущей ветки (master, dev и т.д.)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Определяем имя процесса PM2 в зависимости от ветки
if [ "$BRANCH" == "master" ]; then
  PM2_APP_NAME="telegraf-bot"
else
  PM2_APP_NAME="telegraf-bot-$BRANCH"
fi

echo "⬇️  Pulling changes from GitHub ($BRANCH)..."
git pull origin $BRANCH

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "🔄 Restarting application via PM2 ($PM2_APP_NAME)..."
# Перезапускаем только бота, вебхук-сервис трогать не нужно
pm2 restart $PM2_APP_NAME