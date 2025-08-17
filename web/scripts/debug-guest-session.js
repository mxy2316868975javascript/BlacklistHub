// 调试游客会话的脚本
// 在浏览器控制台中运行

function debugGuestSession() {
  const STORAGE_KEY = "blacklisthub_guest_session";
  
  console.log("=== 游客会话调试信息 ===");
  
  // 检查localStorage中的会话数据
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    console.log("❌ 没有找到游客会话数据");
    return;
  }
  
  try {
    const session = JSON.parse(stored);
    console.log("✅ 找到游客会话数据:");
    console.log("会话ID:", session.sessionId);
    console.log("开始时间:", new Date(session.startTime).toLocaleString());
    console.log("最后活动:", new Date(session.lastActivity).toLocaleString());
    
    console.log("\n--- 使用限制 ---");
    console.log("搜索次数:", session.limitations.searchCount, "/", session.limitations.maxSearchPerDay);
    console.log("查看次数:", session.limitations.viewCount, "/", session.limitations.maxViewPerDay);
    
    console.log("\n--- 限制状态 ---");
    const searchLimitReached = session.limitations.searchCount >= session.limitations.maxSearchPerDay;
    const viewLimitReached = session.limitations.viewCount >= session.limitations.maxViewPerDay;
    
    console.log("搜索限制:", searchLimitReached ? "❌ 已达限制" : "✅ 可用");
    console.log("查看限制:", viewLimitReached ? "❌ 已达限制" : "✅ 可用");
    
    console.log("\n--- 剩余次数 ---");
    console.log("剩余搜索次数:", Math.max(0, session.limitations.maxSearchPerDay - session.limitations.searchCount));
    console.log("剩余查看次数:", Math.max(0, session.limitations.maxViewPerDay - session.limitations.viewCount));
    
    // 检查是否需要重置
    const now = new Date();
    const lastDate = new Date(session.lastActivity);
    const needsReset = (
      now.getDate() !== lastDate.getDate() ||
      now.getMonth() !== lastDate.getMonth() ||
      now.getFullYear() !== lastDate.getFullYear()
    );
    
    console.log("\n--- 重置检查 ---");
    console.log("需要重置:", needsReset ? "✅ 是" : "❌ 否");
    console.log("当前日期:", now.toDateString());
    console.log("最后活动日期:", lastDate.toDateString());
    
  } catch (error) {
    console.error("❌ 解析会话数据失败:", error);
  }
}

function resetGuestSession() {
  const STORAGE_KEY = "blacklisthub_guest_session";
  console.log("🔄 重置游客会话...");
  localStorage.removeItem(STORAGE_KEY);
  console.log("✅ 游客会话已重置，请刷新页面");
}

function createFreshSession() {
  const STORAGE_KEY = "blacklisthub_guest_session";
  const now = Date.now();
  
  const newSession = {
    sessionId: `guest_${now}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: now,
    lastActivity: now,
    limitations: {
      searchCount: 0,
      maxSearchPerDay: 10,
      viewCount: 0,
      maxViewPerDay: 50,
    },
    preferences: {
      showTips: true,
      dismissedPrompts: [],
      language: "zh-CN",
    },
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  console.log("✅ 创建了新的游客会话:", newSession);
  console.log("请刷新页面以应用更改");
}

// 导出函数到全局作用域
window.debugGuestSession = debugGuestSession;
window.resetGuestSession = resetGuestSession;
window.createFreshSession = createFreshSession;

console.log("游客会话调试工具已加载！");
console.log("可用命令:");
console.log("- debugGuestSession() - 查看当前会话状态");
console.log("- resetGuestSession() - 重置会话");
console.log("- createFreshSession() - 创建新会话");
