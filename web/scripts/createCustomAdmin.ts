// 手动设置环境变量（从 .env.local 读取）
import { readFileSync } from "node:fs";
import { join } from "node:path";

// 读取 .env.local 文件（必须在导入其他模块之前）
try {
	const envPath = join(__dirname, "..", ".env.local");
	console.log("尝试读取环境变量文件:", envPath);
	const envContent = readFileSync(envPath, "utf8");
	const envLines = envContent.split("\n");

	for (const line of envLines) {
		const trimmedLine = line.trim();
		if (trimmedLine && !trimmedLine.startsWith("#")) {
			const [key, ...valueParts] = trimmedLine.split("=");
			if (key && valueParts.length > 0) {
				const value = valueParts.join("=");
				process.env[key] = value;
				console.log(`设置环境变量: ${key}=${value.substring(0, 20)}...`);
			}
		}
	}
	console.log("MONGODB_URI:", process.env.MONGODB_URI ? "已设置" : "未设置");
} catch (error) {
	console.error("无法读取 .env.local 文件:", error);
}

// 现在导入其他模块
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User";
import type { UserRole } from "../types/user";

// 创建数据库连接函数
async function connectToDatabase() {
	const MongodbUri = process.env.MONGODB_URI;
	if (!MongodbUri) {
		throw new Error("MONGODB_URI 环境变量未设置");
	}
	console.log("连接到数据库...");
	await mongoose.connect(MongodbUri);
	console.log("数据库连接成功");
}

async function createCustomAdmin() {
	try {
		await connectToDatabase();

		// 从环境变量读取管理员账号信息
		const adminUsername = process.env.account || "admin";
		const adminPassword = process.env.pwd || "Admin#12345";

		console.log(`准备创建/更新管理员账号: ${adminUsername}`);

		// 检查是否已存在admin用户
		const existingAdmin = await User.findOne({ username: adminUsername });
		if (existingAdmin) {
			// 重新生成密码哈希并更新用户
			const passwordHash = await bcrypt.hash(adminPassword, 10);
			await User.updateOne(
				{ username: adminUsername },
				{
					role: "admin" as UserRole,
					password_hash: passwordHash,
				},
			);
			console.log("🔄 管理员账号已更新！");
			console.log("==========================================");
			console.log(`用户名: ${adminUsername}`);
			console.log(`密码: ${adminPassword}`);
			console.log("角色: admin");
			console.log("==========================================");
			return;
		}

		// 创建admin用户
		const passwordHash = await bcrypt.hash(adminPassword, 10);
		const adminUser = await User.create({
			username: adminUsername,
			password_hash: passwordHash,
			role: "admin" as UserRole,
		});

		console.log("🎉 管理员账号创建成功！");
		console.log("==========================================");
		console.log(`用户名: ${adminUsername}`);
		console.log(`密码: ${adminPassword}`);
		console.log(`角色: ${adminUser.role}`);
		console.log("==========================================");
		console.log("请保存好这些信息，并在生产环境中修改密码！");
	} catch (error) {
		console.error("❌ 创建管理员账号失败:", error);
	} finally {
		process.exit(0);
	}
}

createCustomAdmin();
