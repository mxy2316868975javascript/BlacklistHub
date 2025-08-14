import { type NextRequest, NextResponse } from "next/server";

// IP级别的速率限制配置
interface RateLimitConfig {
	windowMs: number; // 时间窗口（毫秒）
	maxRequests: number; // 最大请求数
	maxSearches: number; // 最大搜索数
	maxViews: number; // 最大查看数
}

// 游客安全配置
const GUEST_SECURITY_CONFIG = {
	rateLimiting: {
		perMinute: {
			windowMs: 60 * 1000, // 1分钟
			maxRequests: 30, // 每分钟最大30个请求
			maxSearches: 5, // 每分钟最大5次搜索
			maxViews: 20, // 每分钟最大20次查看
		},
		perHour: {
			windowMs: 60 * 60 * 1000, // 1小时
			maxRequests: 500, // 每小时最大500个请求
			maxSearches: 50, // 每小时最大50次搜索
			maxViews: 200, // 每小时最大200次查看
		},
		perDay: {
			windowMs: 24 * 60 * 60 * 1000, // 24小时
			maxRequests: 2000, // 每日最大2000个请求
			maxSearches: 100, // 每日最大100次搜索
			maxViews: 500, // 每日最大500次查看
		},
	},

	abuse: {
		maxFailedAttempts: 10, // 最大失败尝试次数
		blockDuration: 60 * 60 * 1000, // 封禁时长（1小时）
		suspiciousPatterns: [
			"rapid_requests", // 快速请求
			"automated_access", // 自动化访问
			"data_scraping", // 数据抓取
			"pattern_abuse", // 模式滥用
		],
	},

	session: {
		maxConcurrentSessions: 5, // 单IP最大并发会话数
		sessionTimeout: 2 * 60 * 60 * 1000, // 会话超时（2小时）
		maxSessionsPerDay: 10, // 每日最大会话数
	},
} as const;

// 内存存储（生产环境应使用Redis）
interface IpRecord {
	requests: { timestamp: number; endpoint: string }[];
	searches: { timestamp: number; query: string }[];
	views: { timestamp: number; itemId: string }[];
	failedAttempts: number;
	blockedUntil?: number;
	sessions: string[];
	firstSeen: number;
	lastSeen: number;
	userAgent: string;
	suspiciousScore: number;
}

const ipRecords = new Map<string, IpRecord>();

/**
 * 获取客户端IP地址
 */
function getClientIp(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");

	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	if (realIp) {
		return realIp;
	}

	return "unknown";
}

/**
 * 获取或创建IP记录
 */
function getIpRecord(ip: string, userAgent: string): IpRecord {
	let record = ipRecords.get(ip);

	if (record) {
		record.lastSeen = Date.now();
	} else {
		record = {
			requests: [],
			searches: [],
			views: [],
			failedAttempts: 0,
			sessions: [],
			firstSeen: Date.now(),
			lastSeen: Date.now(),
			userAgent,
			suspiciousScore: 0,
		};
		ipRecords.set(ip, record);
	}

	return record;
}

/**
 * 清理过期记录
 */
function cleanupExpiredRecords(): void {
	const now = Date.now();
	const maxAge = 24 * 60 * 60 * 1000; // 24小时

	for (const [ip, record] of ipRecords.entries()) {
		// 清理过期的请求记录
		record.requests = record.requests.filter(
			(req) => now - req.timestamp < maxAge,
		);
		record.searches = record.searches.filter(
			(search) => now - search.timestamp < maxAge,
		);
		record.views = record.views.filter((view) => now - view.timestamp < maxAge);

		// 如果记录为空且超过24小时未活动，删除整个记录
		if (
			record.requests.length === 0 &&
			record.searches.length === 0 &&
			record.views.length === 0 &&
			now - record.lastSeen > maxAge
		) {
			ipRecords.delete(ip);
		}
	}
}

// 定期清理过期记录
setInterval(cleanupExpiredRecords, 60 * 60 * 1000); // 每小时清理一次

/**
 * 检查速率限制
 */
function checkRateLimit(
	ip: string,
	action: "request" | "search" | "view",
	config: RateLimitConfig,
): { allowed: boolean; resetTime?: number; remaining?: number } {
	const record = ipRecords.get(ip);
	if (!record) return { allowed: true };

	const now = Date.now();
	const windowStart = now - config.windowMs;

	let relevantActions: { timestamp: number }[];
	let maxAllowed: number;

	switch (action) {
		case "request":
			relevantActions = record.requests;
			maxAllowed = config.maxRequests;
			break;
		case "search":
			relevantActions = record.searches;
			maxAllowed = config.maxSearches;
			break;
		case "view":
			relevantActions = record.views;
			maxAllowed = config.maxViews;
			break;
	}

	// 过滤时间窗口内的操作
	const recentActions = relevantActions.filter(
		(action) => action.timestamp > windowStart,
	);
	const remaining = Math.max(0, maxAllowed - recentActions.length);

	if (recentActions.length >= maxAllowed) {
		const oldestAction = Math.min(...recentActions.map((a) => a.timestamp));
		const resetTime = oldestAction + config.windowMs;
		return { allowed: false, resetTime, remaining: 0 };
	}

	return { allowed: true, remaining };
}

/**
 * 检查IP是否被封禁
 */
function isIpBlocked(ip: string): {
	blocked: boolean;
	reason?: string;
	unblockTime?: number;
} {
	const record = ipRecords.get(ip);
	if (!record) return { blocked: false };

	const now = Date.now();

	// 检查是否在封禁期内
	if (record.blockedUntil && now < record.blockedUntil) {
		return {
			blocked: true,
			reason: "IP temporarily blocked due to suspicious activity",
			unblockTime: record.blockedUntil,
		};
	}

	// 清除过期的封禁
	if (record.blockedUntil && now >= record.blockedUntil) {
		record.blockedUntil = undefined;
		record.failedAttempts = 0;
		record.suspiciousScore = Math.max(0, record.suspiciousScore - 10);
	}

	return { blocked: false };
}

/**
 * 记录可疑行为
 */
function recordSuspiciousActivity(
	ip: string,
	pattern: string,
	details?: Record<string, unknown>,
): void {
	const record = getIpRecord(ip, "unknown");
	record.suspiciousScore += 10;
	record.failedAttempts++;

	console.warn(`Suspicious activity detected from IP ${ip}:`, {
		pattern,
		score: record.suspiciousScore,
		attempts: record.failedAttempts,
		details,
	});

	// 如果可疑分数过高，临时封禁
	if (
		record.suspiciousScore >= 50 ||
		record.failedAttempts >= GUEST_SECURITY_CONFIG.abuse.maxFailedAttempts
	) {
		record.blockedUntil =
			Date.now() + GUEST_SECURITY_CONFIG.abuse.blockDuration;
		console.warn(`IP ${ip} has been temporarily blocked`);
	}
}

/**
 * 检测自动化访问模式
 */
function detectAutomatedAccess(record: IpRecord): boolean {
	const now = Date.now();
	const recentRequests = record.requests.filter(
		(req) => now - req.timestamp < 60 * 1000,
	); // 最近1分钟

	// 检查请求频率
	if (recentRequests.length > 20) {
		return true;
	}

	// 检查请求间隔的规律性
	if (recentRequests.length >= 5) {
		const intervals = [];
		for (let i = 1; i < recentRequests.length; i++) {
			intervals.push(
				recentRequests[i].timestamp - recentRequests[i - 1].timestamp,
			);
		}

		// 如果间隔过于规律（标准差很小），可能是自动化
		const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
		const variance =
			intervals.reduce(
				(sum, interval) => sum + (interval - avgInterval) ** 2,
				0,
			) / intervals.length;
		const stdDev = Math.sqrt(variance);

		if (stdDev < avgInterval * 0.1) {
			// 标准差小于平均值的10%
			return true;
		}
	}

	return false;
}

/**
 * 游客安全中间件主函数
 */
export function guestSecurityMiddleware(
	request: NextRequest,
): NextResponse | null {
	const ip = getClientIp(request);
	const userAgent = request.headers.get("user-agent") || "unknown";
	const endpoint = new URL(request.url).pathname;
	const method = request.method;

	// 获取IP记录
	const record = getIpRecord(ip, userAgent);

	// 检查IP是否被封禁
	const blockCheck = isIpBlocked(ip);
	if (blockCheck.blocked) {
		return NextResponse.json(
			{
				error: "Access blocked",
				message: blockCheck.reason,
				unblockTime: blockCheck.unblockTime
					? new Date(blockCheck.unblockTime).toISOString()
					: undefined,
			},
			{ status: 429 },
		);
	}

	// 记录请求
	record.requests.push({ timestamp: Date.now(), endpoint });

	// 检查速率限制
	const rateLimitChecks = [
		{ config: GUEST_SECURITY_CONFIG.rateLimiting.perMinute, window: "minute" },
		{ config: GUEST_SECURITY_CONFIG.rateLimiting.perHour, window: "hour" },
		{ config: GUEST_SECURITY_CONFIG.rateLimiting.perDay, window: "day" },
	];

	for (const { config, window } of rateLimitChecks) {
		const requestCheck = checkRateLimit(ip, "request", config);
		if (!requestCheck.allowed) {
			return NextResponse.json(
				{
					error: "Rate limit exceeded",
					message: `Too many requests per ${window}`,
					resetTime: requestCheck.resetTime
						? new Date(requestCheck.resetTime).toISOString()
						: undefined,
					remaining: requestCheck.remaining,
				},
				{
					status: 429,
					headers: {
						"Retry-After": Math.ceil(
							((requestCheck.resetTime || Date.now()) - Date.now()) / 1000,
						).toString(),
						"X-RateLimit-Limit": config.maxRequests.toString(),
						"X-RateLimit-Remaining": (requestCheck.remaining || 0).toString(),
						"X-RateLimit-Reset": requestCheck.resetTime?.toString() || "",
					},
				},
			);
		}
	}

	// 检测自动化访问
	if (detectAutomatedAccess(record)) {
		recordSuspiciousActivity(ip, "automated_access", {
			userAgent,
			endpoint,
			requestCount: record.requests.length,
		});
	}

	// 检查User-Agent
	if (!userAgent || userAgent === "unknown" || userAgent.length < 10) {
		recordSuspiciousActivity(ip, "suspicious_user_agent", { userAgent });
	}

	// 检查请求方法
	if (method !== "GET" && endpoint.startsWith("/api/guest/")) {
		// 游客API主要应该是GET请求
		if (!["POST"].includes(method) || !endpoint.includes("/session")) {
			recordSuspiciousActivity(ip, "invalid_method", { method, endpoint });
		}
	}

	// 通过所有检查，允许请求继续
	return null;
}

/**
 * 记录游客操作
 */
export function recordGuestAction(
	request: NextRequest,
	action: "search" | "view",
	details?: Record<string, unknown>,
): { allowed: boolean; reason?: string } {
	const ip = getClientIp(request);
	const record = getIpRecord(
		ip,
		request.headers.get("user-agent") || "unknown",
	);

	// 检查相应的速率限制
	const rateLimitChecks = [
		{ config: GUEST_SECURITY_CONFIG.rateLimiting.perMinute, window: "minute" },
		{ config: GUEST_SECURITY_CONFIG.rateLimiting.perHour, window: "hour" },
		{ config: GUEST_SECURITY_CONFIG.rateLimiting.perDay, window: "day" },
	];

	for (const { config, window } of rateLimitChecks) {
		const actionCheck = checkRateLimit(ip, action, config);
		if (!actionCheck.allowed) {
			return {
				allowed: false,
				reason: `${action} rate limit exceeded for ${window}`,
			};
		}
	}

	// 记录操作
	const timestamp = Date.now();
	if (action === "search") {
		record.searches.push({
			timestamp,
			query: (details?.query as string) || "unknown",
		});
	} else if (action === "view") {
		record.views.push({
			timestamp,
			itemId: (details?.itemId as string) || "unknown",
		});
	}

	return { allowed: true };
}

/**
 * 获取IP的使用统计
 */
export function getIPUsageStats(ip: string): {
	requests: { perMinute: number; perHour: number; perDay: number };
	searches: { perMinute: number; perHour: number; perDay: number };
	views: { perMinute: number; perHour: number; perDay: number };
	suspiciousScore: number;
	isBlocked: boolean;
} {
	const record = ipRecords.get(ip);
	if (!record) {
		return {
			requests: { perMinute: 0, perHour: 0, perDay: 0 },
			searches: { perMinute: 0, perHour: 0, perDay: 0 },
			views: { perMinute: 0, perHour: 0, perDay: 0 },
			suspiciousScore: 0,
			isBlocked: false,
		};
	}

	const now = Date.now();

	const countInWindow = (
		actions: { timestamp: number }[],
		windowMs: number,
	) => {
		return actions.filter((action) => now - action.timestamp < windowMs).length;
	};

	return {
		requests: {
			perMinute: countInWindow(record.requests, 60 * 1000),
			perHour: countInWindow(record.requests, 60 * 60 * 1000),
			perDay: countInWindow(record.requests, 24 * 60 * 60 * 1000),
		},
		searches: {
			perMinute: countInWindow(record.searches, 60 * 1000),
			perHour: countInWindow(record.searches, 60 * 60 * 1000),
			perDay: countInWindow(record.searches, 24 * 60 * 60 * 1000),
		},
		views: {
			perMinute: countInWindow(record.views, 60 * 1000),
			perHour: countInWindow(record.views, 60 * 60 * 1000),
			perDay: countInWindow(record.views, 24 * 60 * 60 * 1000),
		},
		suspiciousScore: record.suspiciousScore,
		isBlocked: Boolean(record.blockedUntil && now < record.blockedUntil),
	};
}

/**
 * 验证游客会话
 */
export function validateGuestSession(sessionId: string): {
	valid: boolean;
	reason?: string;
} {
	if (!sessionId) {
		return { valid: false, reason: "Session ID is required" };
	}

	if (!sessionId.startsWith("guest_")) {
		return { valid: false, reason: "Invalid session ID format" };
	}

	// 这里应该检查会话是否存在于存储中
	// 暂时简单验证格式
	const parts = sessionId.split("_");
	if (parts.length !== 3) {
		return { valid: false, reason: "Invalid session ID structure" };
	}

	const timestamp = Number.parseInt(parts[1]);
	if (Number.isNaN(timestamp)) {
		return { valid: false, reason: "Invalid session timestamp" };
	}

	// 检查会话是否过期
	const now = Date.now();
	if (now - timestamp > GUEST_SECURITY_CONFIG.session.sessionTimeout) {
		return { valid: false, reason: "Session expired" };
	}

	return { valid: true };
}

/**
 * 创建安全响应头
 */
export function createSecurityHeaders(ip: string): Headers {
	const stats = getIPUsageStats(ip);
	const headers = new Headers();

	// 速率限制头
	headers.set(
		"X-RateLimit-Requests-Remaining",
		Math.max(
			0,
			GUEST_SECURITY_CONFIG.rateLimiting.perHour.maxRequests -
				stats.requests.perHour,
		).toString(),
	);
	headers.set(
		"X-RateLimit-Searches-Remaining",
		Math.max(
			0,
			GUEST_SECURITY_CONFIG.rateLimiting.perHour.maxSearches -
				stats.searches.perHour,
		).toString(),
	);
	headers.set(
		"X-RateLimit-Views-Remaining",
		Math.max(
			0,
			GUEST_SECURITY_CONFIG.rateLimiting.perHour.maxViews - stats.views.perHour,
		).toString(),
	);

	// 安全头
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("X-Frame-Options", "DENY");
	headers.set("X-XSS-Protection", "1; mode=block");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	// 游客模式标识
	headers.set("X-Guest-Mode", "true");
	headers.set("X-Data-Source", "public");

	return headers;
}

/**
 * 游客安全检查的主要入口函数
 */
export function performGuestSecurityCheck(request: NextRequest): {
	allowed: boolean;
	response?: NextResponse;
	headers?: Headers;
} {
	const ip = getClientIp(request);

	// 执行安全中间件检查
	const middlewareResponse = guestSecurityMiddleware(request);
	if (middlewareResponse) {
		return { allowed: false, response: middlewareResponse };
	}

	// 创建安全响应头
	const securityHeaders = createSecurityHeaders(ip);

	return { allowed: true, headers: securityHeaders };
}

/**
 * 获取游客安全配置（用于前端显示）
 */
export function getGuestSecurityConfig(): {
	limitations: typeof GUEST_SECURITY_CONFIG.rateLimiting;
	sessionConfig: typeof GUEST_SECURITY_CONFIG.session;
} {
	return {
		limitations: GUEST_SECURITY_CONFIG.rateLimiting,
		sessionConfig: GUEST_SECURITY_CONFIG.session,
	};
}
