const axios = require("axios");

async function testLogin() {
	try {
		console.log("🧪 测试超管账号登录...");
		
		const response = await axios.post("http://localhost:3001/api/auth/login", {
			username: "admin",
			password: "Admin#123456"
		});

		if (response.status === 200) {
			console.log("✅ 登录成功!");
			console.log("📝 响应数据:");
			console.log(`   用户名: ${response.data.user.username}`);
			console.log(`   角色: ${response.data.user.role}`);
			console.log(`   Token: ${response.data.token ? "已生成" : "未生成"}`);
		}

	} catch (error) {
		console.error("❌ 登录失败:");
		if (error.response) {
			console.error(`   状态码: ${error.response.status}`);
			console.error(`   错误信息: ${error.response.data.message}`);
		} else {
			console.error(`   网络错误: ${error.message}`);
		}
	}
}

testLogin();
