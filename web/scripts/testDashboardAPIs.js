const axios = require("axios");

async function testDashboardAPIs() {
	try {
		console.log("🧪 测试个人中心相关API...");
		
		// 先登录获取token
		const loginResponse = await axios.post("http://localhost:3001/api/auth/login", {
			username: "admin",
			password: "Admin#123456"
		});

		const token = loginResponse.data.token;
		console.log("✅ 登录成功，获取到token");

		// 设置请求头
		const headers = {
			'Authorization': `Bearer ${token}`,
			'Cookie': `token=${token}`
		};

		console.log("\n📊 测试用户统计API...");
		try {
			const statsResponse = await axios.get("http://localhost:3001/api/user/stats", { headers });
			console.log("✅ 用户统计API正常");
			console.log("📝 统计数据:", JSON.stringify(statsResponse.data, null, 2));
		} catch (error) {
			console.error("❌ 用户统计API失败:", error.response?.data || error.message);
		}

		console.log("\n📝 测试用户记录API...");
		try {
			const recordsResponse = await axios.get("http://localhost:3001/api/user/records?limit=5", { headers });
			console.log("✅ 用户记录API正常");
			console.log("📝 记录数量:", recordsResponse.data.records?.length || 0);
		} catch (error) {
			console.error("❌ 用户记录API失败:", error.response?.data || error.message);
		}

		console.log("\n🕒 测试用户活动API...");
		try {
			const activitiesResponse = await axios.get("http://localhost:3001/api/user/activities?limit=5", { headers });
			console.log("✅ 用户活动API正常");
			console.log("📝 活动数量:", activitiesResponse.data.activities?.length || 0);
		} catch (error) {
			console.error("❌ 用户活动API失败:", error.response?.data || error.message);
		}

		console.log("\n🌐 测试全局统计API...");
		try {
			const globalStatsResponse = await axios.get("http://localhost:3001/api/stats", { headers });
			console.log("✅ 全局统计API正常");
			console.log("📝 全局数据:", JSON.stringify(globalStatsResponse.data, null, 2));
		} catch (error) {
			console.error("❌ 全局统计API失败:", error.response?.data || error.message);
		}

	} catch (error) {
		console.error("❌ 测试失败:", error.message);
	}
}

testDashboardAPIs();
