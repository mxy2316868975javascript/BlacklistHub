const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// 用户模型定义
const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password_hash: { type: String, required: true },
	role: { type: String, enum: ["reporter", "reviewer", "admin", "super_admin"], default: "reporter" },
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

async function resetAdminAccount() {
	try {
		// 连接数据库
		const mongoUri = "mongodb+srv://sgli19921031:r8d7zuhLbNkLlEcj@blacklisthub-cluster.xctldhp.mongodb.net/?retryWrites=true&w=majority&appName=blacklisthub-cluster";
		await mongoose.connect(mongoUri);
		console.log("✅ 数据库连接成功");

		// 检查现有的admin账号
		const existingAdmin = await User.findOne({ username: "admin" });
		
		if (existingAdmin) {
			console.log("📋 找到现有admin账号:");
			console.log(`   用户名: ${existingAdmin.username}`);
			console.log(`   角色: ${existingAdmin.role}`);
			console.log(`   创建时间: ${existingAdmin.created_at}`);
		}

		// 检查当前密码是否匹配
		if (existingAdmin) {
			const passwords = ["Admin#123456", "Admin#12345"];
			for (const pwd of passwords) {
				const isMatch = await bcrypt.compare(pwd, existingAdmin.password_hash);
				console.log(`🔐 密码 "${pwd}" 验证: ${isMatch ? "✅ 匹配" : "❌ 不匹配"}`);
			}
		}

		// 生成新密码的哈希
		const newPassword = "Admin#123456";
		const saltRounds = 12;
		const passwordHash = await bcrypt.hash(newPassword, saltRounds);

		// 更新或创建admin账号
		const adminUser = await User.findOneAndUpdate(
			{ username: "admin" },
			{
				username: "admin",
				password_hash: passwordHash,
				role: "super_admin",
				updated_at: new Date()
			},
			{ 
				upsert: true, 
				new: true,
				setDefaultsOnInsert: true
			}
		);

		console.log("🎉 超管账号重置成功!");
		console.log("📝 账号信息:");
		console.log(`   用户名: admin`);
		console.log(`   密码: Admin#123456`);
		console.log(`   角色: super_admin`);
		console.log(`   ID: ${adminUser._id}`);

		// 验证密码是否正确
		const isPasswordValid = await bcrypt.compare(newPassword, adminUser.password_hash);
		console.log(`🔐 密码验证: ${isPasswordValid ? "✅ 通过" : "❌ 失败"}`);

		// 检查所有管理员账号
		const allAdmins = await User.find({ 
			role: { $in: ["admin", "super_admin"] } 
		}).select("username role created_at");
		
		console.log("\n👥 所有管理员账号:");
		allAdmins.forEach(admin => {
			console.log(`   ${admin.username} (${admin.role}) - ${admin.created_at.toLocaleDateString()}`);
		});

	} catch (error) {
		console.error("❌ 重置失败:", error);
	} finally {
		await mongoose.disconnect();
		console.log("🔌 数据库连接已关闭");
	}
}

// 运行脚本
resetAdminAccount();
