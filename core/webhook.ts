import http from "http";
import crypto from "crypto";
import { exec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.DEPLOY_PORT || 3000;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;

if (!SECRET) {
	console.error("❌ GITHUB_WEBHOOK_SECRET не установлен в .env");
	process.exit(1);
}

const server = http.createServer((req, res) => {
	if (req.method === "POST" && req.url === "/webhook") {
		let body = "";

		req.on("data", (chunk) => {
			body += chunk.toString();
		});

		req.on("end", () => {
			const signature = req.headers["x-hub-signature-256"];
			const hmac = crypto.createHmac("sha256", SECRET);
			const digest = "sha256=" + hmac.update(body).digest("hex");

			if (signature === digest) {
				console.log("✅ Подпись верна. Начинаю деплой...");

				// Запускаем скрипт деплоя
				exec("sh deploy.sh", (error, stdout, stderr) => {
					if (error) {
						console.error(`❌ Ошибка деплоя: ${error.message}`);
						return;
					}
					if (stderr) console.error(`⚠️ Stderr: ${stderr}`);
					console.log(`🎉 Stdout: ${stdout}`);
				});

				res.writeHead(200);
				res.end("Deploy started");
			} else {
				console.warn("❌ Неверная подпись вебхука");
				res.writeHead(401);
				res.end("Invalid signature");
			}
		});
	} else {
		res.writeHead(404);
		res.end();
	}
});

server.listen(PORT, () => {
	console.log(`🚀 Webhook listener running on port ${PORT}`);
});