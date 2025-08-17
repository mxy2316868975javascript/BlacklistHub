const mongoose = require("mongoose");

// 用户模型定义
const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password_hash: { type: String, required: true },
	role: { type: String, enum: ["reporter", "reviewer", "admin", "super_admin"], default: "reporter" },
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
	last_login: { type: Date },
});

const User = mongoose.model("User", userSchema);

async function updateUserTimestamps() {
	try {
		// 连接数据库
		const mongoUri = "mongodb+srv://sgli19921031:r8d7zuhLbNkLlEcj@blacklisthub-cluster.xctldhp.mongodb.net/?retryWrites=true&w=majority&appName=blacklisthub-cluster";
		await mongoose.connect(mongoUri);
		console.log("✅ 数据库连接成功");

		// 查找所有没有created_at字段的用户
		const usersWithoutTimestamps = await User.find({
			$or: [
				{ created_at: { $exists: false } },
				{ updated_at: { $exists: false } }
			]
		});

		console.log(`📋 找到 ${usersWithoutTimestamps.length} 个需要更新时间戳的用户`);

		for (const user of usersWithoutTimestamps) {
			const now = new Date();
			// 如果用户有ObjectId，可以从中提取创建时间
			const createdAt = user._id.getTimestamp ? user._id.getTimestamp() : now;
			
			await User.findByIdAndUpdate(user._id, {
				created_at: user.created_at || createdAt,
				updated_at: user.updated_at || now,
			});

			console.log(`✅ 更新用户 ${user.username} 的时间戳`);
		}

		// 显示所有用户的最新信息
		const allUsers = await User.find({}).select("username role created_at updated_at last_login");
		console.log("\n👥 所有用户信息:");
		allUsers.forEach(user => {
			console.log(`   ${user.username} (${user.role})`);
			console.log(`     创建时间: ${user.created_at ? user.created_at.toLocaleString() : "未知"}`);
			console.log(`     更新时间: ${user.updated_at ? user.updated_at.toLocaleString() : "未知"}`);
			console.log(`     最后登录: ${user.last_login ? user.last_login.toLocaleString() : "从未登录"}`);
			console.log("");
		});

	} catch (error) {
		console.error("❌ 更新失败:", error);
	} finally {
		await mongoose.disconnect();
		console.log("🔌 数据库连接已关闭");
	}
}

// 运行脚本
updateUserTimestamps();
