import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import User from "../models/User";
import type { UserRole } from "../types/user";

async function createAdmin() {
	try {
		await connectDB();

		const adminUsername = "admin";
		const adminPassword = "admin123456";

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

createAdmin();
