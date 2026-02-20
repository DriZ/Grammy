module.exports = {
  apps: [
    {
      name: "telegraf-bot",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "production",
      },
      // Если бот упадет, PM2 его поднимет
      autorestart: true,
    },
    {
      name: "webhook-listener",
      // Запускаем через ts-node или компилируем отдельно. 
      // Для простоты здесь используем ts-node, но лучше скомпилировать в dist/deploy/webhook.js
      script: "./deploy/webhook.ts", 
      interpreter: "node",
      interpreter_args: "--loader ts-node/esm",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
