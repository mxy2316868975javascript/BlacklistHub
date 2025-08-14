/**
 * 游客角色安全加固配置
 */

import type { NextRequest } from "next/server";

// 安全威胁类型
export enum ThreatType {
	RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
	SUSPICIOUS_PATTERN = "suspicious_pattern",
	AUTOMATED_ACCESS = "automated_access",
	DATA_SCRAPING = "data_scraping",
	INVALID_SESSION = "invalid_session",
	MALICIOUS_INPUT = "malicious_input",
	RESOURCE_ABUSE = "resource_abuse",
}

// 安全事件接口
interface SecurityEvent {
	type: ThreatType;
	ip: string;
	userAgent: string;
	timestamp: number;
	details: Record<string, unknown>;
	severity: "low" | "medium" | "high" | "critical";
	blocked: boolean;
}

// 安全配置
export const SECURITY_CONFIG = {
	// 输入验证
	validation: {
		maxQueryLength: 100,
		maxSessionIdLength: 50,
		allowedCharacters: /^[a-zA-Z0-9@._\-\s]+$/,
		blockedPatterns: [
			/<script/i,
			/javascript:/i,
			/on\w+\s*=/i,
			/eval\s*\(/i,
			/expression\s*\(/i,
		],
	},

	// 速率限制
	rateLimiting: {
		global: {
			windowMs: 60 * 1000, // 1分钟
			maxRequests: 100, // 每分钟最大100个请求
		},
		search: {
			windowMs: 60 * 1000, // 1分钟
			maxRequests: 10, // 每分钟最大10次搜索
		},
		view: {
			windowMs: 60 * 1000, // 1分钟
			maxRequests: 30, // 每分钟最大30次查看
		},
	},

	// IP封禁
	ipBlocking: {
		maxViolations: 5, // 最大违规次数
		blockDuration: 60 * 60 * 1000, // 封禁时长：1小时
		escalationFactor: 2, // 重复违规的惩罚倍数
	},

	// 会话安全
	session: {
		maxAge: 2 * 60 * 60 * 1000, // 最大会话时长：2小时
		renewThreshold: 30 * 60 * 1000, // 续期阈值：30分钟
		maxConcurrent: 3, // 单IP最大并发会话数
	},

	// 内容安全策略
	csp: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
		styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
		fontSrc: ["'self'", "https://fonts.gstatic.com"],
		imgSrc: ["'self'", "data:", "https:"],
		connectSrc: ["'self'"],
		frameSrc: ["'none'"],
		objectSrc: ["'none'"],
		mediaSrc: ["'self'"],
	},
} as const;

// 安全事件存储（生产环境应使用数据库）
const securityEvents: SecurityEvent[] = [];
const ipViolations = new Map<
	string,
	{ count: number; lastViolation: number; blockUntil?: number }
>();

/**
 * 输入验证
 */
export function validateInput(
	input: string,
	type: "query" | "sessionId" | "general",
): {
	valid: boolean;
	reason?: string;
} {
	if (!input || typeof input !== "string") {
		return { valid: false, reason: "Input is required and must be a string" };
	}

	// 长度检查
	const maxLength =
		type === "query"
			? SECURITY_CONFIG.validation.maxQueryLength
			: type === "sessionId"
				? SECURITY_CONFIG.validation.maxSessionIdLength
				: 200;

	if (input.length > maxLength) {
		return {
			valid: false,
			reason: `Input exceeds maximum length of ${maxLength}`,
		};
	}

	// 字符检查
	if (!SECURITY_CONFIG.validation.allowedCharacters.test(input)) {
		return { valid: false, reason: "Input contains invalid characters" };
	}

	// 恶意模式检查
	for (const pattern of SECURITY_CONFIG.validation.blockedPatterns) {
		if (pattern.test(input)) {
			return {
				valid: false,
				reason: "Input contains potentially malicious content",
			};
		}
	}

	return { valid: true };
}

/**
 * 检测自动化访问
 */
export function detectAutomatedAccess(request: NextRequest): {
	isAutomated: boolean;
	confidence: number;
	reasons: string[];
} {
	const userAgent = request.headers.get("user-agent") || "";
	const reasons: string[] = [];
	let confidence = 0;

	// User-Agent检查
	if (!userAgent) {
		reasons.push("Missing User-Agent header");
		confidence += 30;
	} else if (userAgent.length < 20) {
		reasons.push("Suspicious User-Agent length");
		confidence += 20;
	} else if (/bot|crawler|spider|scraper/i.test(userAgent)) {
		reasons.push("Bot-like User-Agent");
		confidence += 40;
	}

	// 请求头检查
	const acceptHeader = request.headers.get("accept");
	if (!acceptHeader || !acceptHeader.includes("text/html")) {
		reasons.push("Missing or invalid Accept header");
		confidence += 15;
	}

	const acceptLanguage = request.headers.get("accept-language");
	if (!acceptLanguage) {
		reasons.push("Missing Accept-Language header");
		confidence += 10;
	}

	const acceptEncoding = request.headers.get("accept-encoding");
	if (!acceptEncoding) {
		reasons.push("Missing Accept-Encoding header");
		confidence += 10;
	}

	// 检查是否有常见的浏览器头
	const browserHeaders = [
		"sec-ch-ua",
		"sec-ch-ua-mobile",
		"sec-fetch-site",
		"sec-fetch-mode",
	];
	const missingBrowserHeaders = browserHeaders.filter(
		(header) => !request.headers.get(header),
	);

	if (missingBrowserHeaders.length > 2) {
		reasons.push("Missing browser security headers");
		confidence += 15;
	}

	return {
		isAutomated: confidence > 50,
		confidence,
		reasons,
	};
}

/**
 * 记录安全事件
 */
export function recordSecurityEvent(
	type: ThreatType,
	ip: string,
	userAgent: string,
	details: Record<string, unknown> = {},
	severity: SecurityEvent["severity"] = "medium",
): void {
	const event: SecurityEvent = {
		type,
		ip,
		userAgent,
		timestamp: Date.now(),
		details,
		severity,
		blocked: false,
	};

	securityEvents.push(event);

	// 更新IP违规记录
	const violation = ipViolations.get(ip) || { count: 0, lastViolation: 0 };
	violation.count++;
	violation.lastViolation = Date.now();

	// 检查是否需要封禁
	if (violation.count >= SECURITY_CONFIG.ipBlocking.maxViolations) {
		const blockDuration =
			SECURITY_CONFIG.ipBlocking.blockDuration *
			SECURITY_CONFIG.ipBlocking.escalationFactor **
				(Math.floor(
					violation.count / SECURITY_CONFIG.ipBlocking.maxViolations,
				) -
					1);

		violation.blockUntil = Date.now() + blockDuration;
		event.blocked = true;

		console.warn(
			`[Security] IP ${ip} blocked for ${blockDuration}ms due to ${violation.count} violations`,
		);
	}

	ipViolations.set(ip, violation);

	// 记录日志
	console.warn("[Security] Event recorded:", {
		type,
		ip,
		severity,
		blocked: event.blocked,
		details,
	});

	// 在生产环境中，这里应该发送到安全监控系统
	if (process.env.NODE_ENV === "production") {
		// sendToSecurityMonitoring(event);
	}
}

/**
 * 检查IP是否被封禁
 */
export function isIPBlocked(ip: string): {
	blocked: boolean;
	reason?: string;
	unblockTime?: number;
} {
	const violation = ipViolations.get(ip);
	if (!violation || !violation.blockUntil) {
		return { blocked: false };
	}

	const now = Date.now();
	if (now < violation.blockUntil) {
		return {
			blocked: true,
			reason: `IP blocked due to ${violation.count} security violations`,
			unblockTime: violation.blockUntil,
		};
	}

	// 清除过期的封禁
	violation.blockUntil = undefined;
	violation.count = Math.max(0, violation.count - 1); // 减少违规计数
	ipViolations.set(ip, violation);

	return { blocked: false };
}

/**
 * 生成安全响应头
 */
export function generateSecurityHeaders(): Headers {
	const headers = new Headers();

	// 基础安全头
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("X-Frame-Options", "DENY");
	headers.set("X-XSS-Protection", "1; mode=block");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

	// CSP头
	const cspDirectives = Object.entries(SECURITY_CONFIG.csp)
		.map(
			([directive, sources]) =>
				`${directive.replace(/([A-Z])/g, "-$1").toLowerCase()} ${sources.join(" ")}`,
		)
		.join("; ");
	headers.set("Content-Security-Policy", cspDirectives);

	// 游客模式标识
	headers.set("X-Guest-Mode", "true");
	headers.set("X-Security-Level", "guest");

	return headers;
}

/**
 * 安全审计
 */
export function performSecurityAudit(): {
	totalEvents: number;
	blockedIPs: number;
	threatDistribution: Record<ThreatType, number>;
	severityDistribution: Record<SecurityEvent["severity"], number>;
	recentEvents: SecurityEvent[];
} {
	const now = Date.now();
	const last24Hours = now - 24 * 60 * 60 * 1000;

	// 过滤最近24小时的事件
	const recentEvents = securityEvents.filter(
		(event) => event.timestamp > last24Hours,
	);

	// 统计威胁类型分布
	const threatDistribution = {} as Record<ThreatType, number>;
	const severityDistribution = { low: 0, medium: 0, high: 0, critical: 0 };

	for (const event of recentEvents) {
		threatDistribution[event.type] = (threatDistribution[event.type] || 0) + 1;
		severityDistribution[event.severity]++;
	}

	// 统计被封禁的IP数量
	const blockedIPs = Array.from(ipViolations.values()).filter(
		(violation) => violation.blockUntil && now < violation.blockUntil,
	).length;

	return {
		totalEvents: recentEvents.length,
		blockedIPs,
		threatDistribution,
		severityDistribution,
		recentEvents: recentEvents.slice(-10), // 最近10个事件
	};
}

/**
 * 清理安全数据
 */
export function cleanupSecurityData(): void {
	const now = Date.now();
	const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

	// 清理过期的安全事件
	const validEvents = securityEvents.filter(
		(event) => now - event.timestamp < maxAge,
	);
	securityEvents.length = 0;
	securityEvents.push(...validEvents);

	// 清理过期的IP违规记录
	for (const [ip, violation] of ipViolations.entries()) {
		if (
			violation.blockUntil &&
			now > violation.blockUntil &&
			now - violation.lastViolation > maxAge
		) {
			ipViolations.delete(ip);
		}
	}

	console.log(
		`[Security] Cleanup completed. Events: ${securityEvents.length}, IP violations: ${ipViolations.size}`,
	);
}

/**
 * 安全中间件主函数
 */
export function guestSecurityMiddleware(request: NextRequest): {
	allowed: boolean;
	response?: Response;
	headers?: Headers;
	event?: SecurityEvent;
} {
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0] ||
		request.headers.get("x-real-ip") ||
		"unknown";
	const userAgent = request.headers.get("user-agent") || "";
	const url = new URL(request.url);

	// 检查IP是否被封禁
	const blockCheck = isIPBlocked(ip);
	if (blockCheck.blocked) {
		const event: SecurityEvent = {
			type: ThreatType.RATE_LIMIT_EXCEEDED,
			ip,
			userAgent,
			timestamp: Date.now(),
			details: {
				reason: blockCheck.reason,
				unblockTime: blockCheck.unblockTime,
			},
			severity: "high",
			blocked: true,
		};

		return {
			allowed: false,
			response: new Response(
				JSON.stringify({
					error: "Access blocked",
					message: blockCheck.reason,
					unblockTime: blockCheck.unblockTime
						? new Date(blockCheck.unblockTime).toISOString()
						: undefined,
				}),
				{
					status: 429,
					headers: {
						"Content-Type": "application/json",
						"Retry-After": blockCheck.unblockTime
							? Math.ceil(
									(blockCheck.unblockTime - Date.now()) / 1000,
								).toString()
							: "3600",
					},
				},
			),
			event,
		};
	}

	// 检测自动化访问
	const automationCheck = detectAutomatedAccess(request);
	if (automationCheck.isAutomated && automationCheck.confidence > 70) {
		recordSecurityEvent(
			ThreatType.AUTOMATED_ACCESS,
			ip,
			userAgent,
			{
				confidence: automationCheck.confidence,
				reasons: automationCheck.reasons,
				url: url.pathname,
			},
			"medium",
		);
	}

	// 输入验证
	const query = url.searchParams.get("q");
	if (query) {
		const validation = validateInput(query, "query");
		if (!validation.valid) {
			recordSecurityEvent(
				ThreatType.MALICIOUS_INPUT,
				ip,
				userAgent,
				{
					input: query,
					reason: validation.reason,
					url: url.pathname,
				},
				"medium",
			);

			return {
				allowed: false,
				response: new Response(
					JSON.stringify({
						error: "Invalid input",
						message: validation.reason,
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				),
			};
		}
	}

	// 检查请求频率
	// 这里应该实现更复杂的速率限制逻辑

	// 生成安全响应头
	const securityHeaders = generateSecurityHeaders();

	return {
		allowed: true,
		headers: securityHeaders,
	};
}

/**
 * 安全监控仪表板数据
 */
export function getSecurityDashboard(): {
	overview: {
		totalThreats: number;
		blockedIPs: number;
		activeViolations: number;
		systemHealth: "good" | "warning" | "critical";
	};
	threats: {
		type: ThreatType;
		count: number;
		trend: "increasing" | "stable" | "decreasing";
	}[];
	topOffenders: {
		ip: string;
		violations: number;
		lastSeen: string;
		blocked: boolean;
	}[];
} {
	const audit = performSecurityAudit();
	const now = Date.now();

	// 计算系统健康状态
	let systemHealth: "good" | "warning" | "critical" = "good";
	if (audit.severityDistribution.critical > 0) {
		systemHealth = "critical";
	} else if (audit.severityDistribution.high > 5 || audit.totalEvents > 100) {
		systemHealth = "warning";
	}

	// 威胁趋势分析（简化版）
	const threats = Object.entries(audit.threatDistribution).map(
		([type, count]) => ({
			type: type as ThreatType,
			count,
			trend: "stable" as const, // 实际应该基于历史数据计算
		}),
	);

	// 获取违规最多的IP
	const topOffenders = Array.from(ipViolations.entries())
		.sort(([, a], [, b]) => b.count - a.count)
		.slice(0, 10)
		.map(([ip, violation]) => ({
			ip,
			violations: violation.count,
			lastSeen: new Date(violation.lastViolation).toISOString(),
			blocked: Boolean(violation.blockUntil && now < violation.blockUntil),
		}));

	return {
		overview: {
			totalThreats: audit.totalEvents,
			blockedIPs: audit.blockedIPs,
			activeViolations: ipViolations.size,
			systemHealth,
		},
		threats,
		topOffenders,
	};
}

/**
 * 安全配置验证
 */
export function validateSecurityConfig(): {
	valid: boolean;
	issues: string[];
	recommendations: string[];
} {
	const issues: string[] = [];
	const recommendations: string[] = [];

	// 检查速率限制配置
	if (SECURITY_CONFIG.rateLimiting.global.maxRequests > 1000) {
		recommendations.push(
			"Consider lowering global rate limit for better security",
		);
	}

	if (SECURITY_CONFIG.rateLimiting.search.maxRequests > 50) {
		recommendations.push("Search rate limit might be too high for guest users");
	}

	// 检查封禁配置
	if (SECURITY_CONFIG.ipBlocking.blockDuration < 60 * 1000) {
		issues.push("IP block duration is too short");
	}

	if (SECURITY_CONFIG.ipBlocking.maxViolations > 10) {
		recommendations.push("Consider lowering max violations threshold");
	}

	// 检查会话配置
	if (SECURITY_CONFIG.session.maxAge > 4 * 60 * 60 * 1000) {
		recommendations.push("Session max age might be too long");
	}

	// 检查CSP配置
	if (SECURITY_CONFIG.csp.scriptSrc.includes("'unsafe-eval'")) {
		recommendations.push("Consider removing unsafe-eval from CSP");
	}

	return {
		valid: issues.length === 0,
		issues,
		recommendations,
	};
}

/**
 * 初始化安全系统
 */
export function initializeGuestSecurity(): void {
	// 验证安全配置
	const validation = validateSecurityConfig();
	if (!validation.valid) {
		console.error("[Security] Configuration issues:", validation.issues);
	}

	if (validation.recommendations.length > 0) {
		console.warn("[Security] Recommendations:", validation.recommendations);
	}

	// 启动定期清理
	setInterval(cleanupSecurityData, 60 * 60 * 1000); // 每小时清理一次

	// 在开发环境中启用详细日志
	if (process.env.NODE_ENV === "development") {
		setInterval(
			() => {
				const dashboard = getSecurityDashboard();
				console.log("[Security] Dashboard:", dashboard.overview);
			},
			5 * 60 * 1000,
		); // 每5分钟输出一次
	}

	console.log("[Security] Guest security system initialized");
}

// 导出工具函数
export const securityUtils = {
	validateInput,
	detectAutomatedAccess,
	recordSecurityEvent,
	isIPBlocked,
	generateSecurityHeaders,
	performSecurityAudit,
	getSecurityDashboard,
	cleanupSecurityData,
};
