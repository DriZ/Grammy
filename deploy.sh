#!/bin/bash

echo "⬇️  Pulling changes from GitHub..."
git pull origin master

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "🔄 Restarting application via PM2..."
# Перезапускаем только бота, вебхук-сервис трогать не нужно
pm2 restart telegraf-bot