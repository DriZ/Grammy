module.exports = {
  apps: [
    {
      name: "bot",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "production",
      },
      // Если бот упадет, PM2 его поднимет
      autorestart: true,
    },
  ],
};
