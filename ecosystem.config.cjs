module.exports = {
	apps: [
		{
			name: "Telegraf-Bot",
			script: "./index.mjs",
			interpreter: "node",
			env: {
				NODE_ENV: "development",
				TOKEN: process.env.TOKEN,
			},
			env_production: {
				NODE_ENV: "production",
			},
			instances: 1,
			exec_mode: "fork",
			watch: false,
			max_memory_restart: "200M",
			error_file: "./logs/error.log",
			out_file: "./logs/out.log",
			log_file: "./logs/combined.log",
			time: true,
			autorestart: true,
			max_restarts: 10,
			min_uptime: "10s",
		},
	],
};
