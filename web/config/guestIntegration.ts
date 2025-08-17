/**
 * 游客角色系统集成配置
 */

import { Permission, UserRole } from "@/types/enums";

// 游客系统配置
export const GUEST_SYSTEM_CONFIG = {
	// 会话配置
	session: {
		storageKey: "blacklisthub_guest_session",
		timeout: 2 * 60 * 60 * 1000, // 2小时
		syncInterval: 5000, // 5秒同步一次
		maxConcurrentSessions: 5,
	},

	// 使用限制
	limitations: {
		search: {
			dailyLimit: 10,
			hourlyLimit: 20,
			minuteLimit: 5,
		},
		view: {
			dailyLimit: 50,
			hourlyLimit: 100,
			minuteLimit: 20,
		},
		results: {
			maxPerPage: 20,
			maxTotal: 100,
		},
	},

	// 数据过滤
	dataFilter: {
		allowedFields: {
			blacklist: [
				"id",
				"type",
				"value",
				"riskLevel",
				"reasonCode",
				"createdAt",
				"status",
			],
			search: ["id", "type", "value", "riskLevel", "reasonCode", "matchScore"],
			stats: [
				"totalBlacklist",
				"publishedCount",
				"totalUsers",
			],
		},
		maskedFields: ["value"],
		hiddenFields: [
			"operator",
			"internalNotes",
			"sourceDetails",
			"reviewerNotes",
		],
	},

	// 安全配置
	security: {
		rateLimiting: {
			enabled: true,
			windowMs: 60 * 1000, // 1分钟窗口
			maxRequests: 30,
		},
		ipBlocking: {
			enabled: true,
			maxFailedAttempts: 10,
			blockDuration: 60 * 60 * 1000, // 1小时
		},
		sessionValidation: {
			enabled: true,
			requireValidFormat: true,
			checkExpiration: true,
		},
	},

	// UI配置
	ui: {
		showTips: true,
		autoPrompt: {
			enabled: true,
			triggers: {
				timeBasedMs: 5 * 60 * 1000, // 5分钟后
				usageThreshold: 0.8, // 80%使用量
				featureAttempt: true,
				exitIntent: true,
			},
		},
		animations: {
			enabled: true,
			duration: 300,
		},
	},

	// API配置
	api: {
		baseUrl: "/api/guest",
		timeout: 10000, // 10秒
		retryAttempts: 3,
		retryDelay: 1000,
		endpoints: {
			blacklist: "/blacklist/public",
			search: "/search",
			stats: "/stats",
			session: "/session",
		},
	},
} as const;

// 路由配置
export const GUEST_ROUTE_CONFIG = {
	// 完全公开路由（无需任何认证）
	public: ["/login", "/register", "/help", "/terms", "/privacy"],

	// 游客可访问路由（游客模式或已登录）
	guest: ["/", "/blacklist/public", "/search", "/stats/public"],

	// 需要认证的路由（必须登录）
	protected: [
		"/dashboard",
		"/blacklist/new",
		"/blacklist/edit",
		"/profile",
		"/defaulters",
		"/contributors",
		"/rankings",
		"/users",
		"/admin",
	],

	// 游客模式重定向规则
	redirects: {
		"/blacklist": "/blacklist/public",
		"/stats": "/stats/public",
	},
} as const;

// 权限映射
export const GUEST_PERMISSION_MAP = {
	[UserRole.GUEST]: [
		Permission.VIEW_PUBLIC_BLACKLIST,
		Permission.SEARCH_PUBLIC_DATA,
		Permission.VIEW_PUBLIC_STATS,
		Permission.VIEW_HELP_DOCS,
	],
} as const;

// 组件集成配置
export const GUEST_COMPONENT_CONFIG = {
	navigation: {
		showUsageStats: true,
		showUpgradePrompt: true,
		mobileBreakpoint: 768,
	},

	homePage: {
		showWelcomeBanner: true,
		showQuickSearch: true,
		showStats: true,
		showRecentItems: true,
		maxRecentItems: 6,
	},

	blacklistPage: {
		showFilters: true,
		showPagination: true,
		showUpgradePrompt: true,
		itemsPerPage: 20,
	},

	searchPage: {
		showHistory: true,
		showSuggestions: true,
		maxHistoryItems: 5,
		maxResults: 20,
	},

	registrationGuide: {
		showComparison: true,
		autoClose: false,
		showBenefits: true,
	},
} as const;

// 集成验证函数
export function validateGuestIntegration(): {
	valid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	// 检查必要的配置
	if (!GUEST_SYSTEM_CONFIG.session.storageKey) {
		errors.push("Session storage key is required");
	}

	if (GUEST_SYSTEM_CONFIG.limitations.search.dailyLimit <= 0) {
		errors.push("Search daily limit must be positive");
	}

	if (GUEST_SYSTEM_CONFIG.limitations.view.dailyLimit <= 0) {
		errors.push("View daily limit must be positive");
	}

	// 检查路由配置
	if (GUEST_ROUTE_CONFIG.public.length < 1) {
		warnings.push("No public routes configured");
	}

	if (GUEST_ROUTE_CONFIG.guest.length < 1) {
		errors.push("No guest routes configured");
	}

	// 检查权限配置
	const guestPermissions = GUEST_PERMISSION_MAP[UserRole.GUEST];
	if (!guestPermissions || guestPermissions.length < 1) {
		errors.push("No permissions configured for guest role");
	}

	// 检查API配置
	if (!GUEST_SYSTEM_CONFIG.api.baseUrl) {
		errors.push("API base URL is required");
	}

	if (GUEST_SYSTEM_CONFIG.api.timeout <= 0) {
		warnings.push("API timeout should be positive");
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

// 初始化游客系统
export function initializeGuestSystem(): Promise<{
	success: boolean;
	message: string;
}> {
	return new Promise((resolve) => {
		try {
			// 验证配置
			const validation = validateGuestIntegration();
			if (!validation.valid) {
				resolve({
					success: false,
					message: `Configuration errors: ${validation.errors.join(", ")}`,
				});
				return;
			}

			// 初始化本地存储
			if (typeof window !== "undefined") {
				// 检查localStorage可用性
				try {
					localStorage.setItem("test", "test");
					localStorage.removeItem("test");
				} catch (error) {
					resolve({
						success: false,
						message: "localStorage is not available",
					});
					return;
				}

				// 清理过期的会话数据
				const sessionKey = GUEST_SYSTEM_CONFIG.session.storageKey;
				const existingSession = localStorage.getItem(sessionKey);
				if (existingSession) {
					try {
						const session = JSON.parse(existingSession);
						const now = Date.now();
						if (
							now - session.lastActivity >
							GUEST_SYSTEM_CONFIG.session.timeout
						) {
							localStorage.removeItem(sessionKey);
						}
					} catch (error) {
						localStorage.removeItem(sessionKey);
					}
				}
			}

			// 输出警告信息
			if (validation.warnings.length > 0) {
				console.warn("Guest system warnings:", validation.warnings);
			}

			resolve({
				success: true,
				message: "Guest system initialized successfully",
			});
		} catch (error) {
			resolve({
				success: false,
				message: `Initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			});
		}
	});
}

// 获取游客系统状态
export function getGuestSystemStatus(): {
	configured: boolean;
	sessionActive: boolean;
	limitationsActive: boolean;
	securityActive: boolean;
} {
	const validation = validateGuestIntegration();

	let sessionActive = false;
	if (typeof window !== "undefined") {
		const sessionKey = GUEST_SYSTEM_CONFIG.session.storageKey;
		const existingSession = localStorage.getItem(sessionKey);
		sessionActive = Boolean(existingSession);
	}

	return {
		configured: validation.valid,
		sessionActive,
		limitationsActive: GUEST_SYSTEM_CONFIG.limitations.search.dailyLimit > 0,
		securityActive: GUEST_SYSTEM_CONFIG.security.rateLimiting.enabled,
	};
}

// 导出类型定义
export type GuestSystemConfig = typeof GUEST_SYSTEM_CONFIG;
export type GuestRouteConfig = typeof GUEST_ROUTE_CONFIG;
export type GuestComponentConfig = typeof GUEST_COMPONENT_CONFIG;
