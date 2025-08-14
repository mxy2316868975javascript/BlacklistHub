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
	const MONGODB_URI = process.env.MONGODB_URI;
	if (!MONGODB_URI) {
		throw new Error("MONGODB_URI 环境变量未设置");
	}
	console.log("连接到数据库...");
	await mongoose.connect(MONGODB_URI);
	console.log("数据库连接成功");
}

async function createSuperAdmin() {
	try {
		await connectToDatabase();

		const superAdminUsername = "superadmin";
		const superAdminPassword = "superadmin123456";

		// 检查是否已存在超级管理员用户
		const existingSuperAdmin = await User.findOne({
			username: superAdminUsername,
		});
		if (existingSuperAdmin) {
			// 重新生成密码哈希并更新用户
			const password_hash = await bcrypt.hash(superAdminPassword, 10);
			await User.updateOne(
				{ username: superAdminUsername },
				{
					role: "super_admin" as UserRole,
					password_hash: password_hash,
				},
			);
			console.log("🔄 超级管理员账号已更新！");
			console.log("==========================================");
			console.log(`用户名: ${superAdminUsername}`);
			console.log(`密码: ${superAdminPassword}`);
			console.log(`角色: super_admin`);
			console.log("==========================================");
			return;
		}

		// 创建超级管理员用户
		const password_hash = await bcrypt.hash(superAdminPassword, 10);
		const superAdminUser = await User.create({
			username: superAdminUsername,
			password_hash,
			role: "super_admin" as UserRole,
		});

		console.log("🎉 超级管理员账号创建成功！");
		console.log("==========================================");
		console.log(`用户名: ${superAdminUsername}`);
		console.log(`密码: ${superAdminPassword}`);
		console.log(`角色: ${superAdminUser.role}`);
		console.log("==========================================");
		console.log("⚠️  超级管理员拥有系统最高权限，请妥善保管账号信息！");
		console.log("🔒 建议在生产环境中立即修改密码！");
		console.log("");
		console.log("超级管理员权限包括：");
		console.log("- 系统级控制：拥有所有系统功能的最高权限");
		console.log("- 不可删除：其他用户无法删除超级管理员账户");
		console.log("- 权限管理：可以管理所有其他角色的权限");
	} catch (error) {
		console.error("❌ 创建超级管理员账号失败:", error);
	} finally {
		process.exit(0);
	}
}

createSuperAdmin();
