"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * 游客会话接口定义
 */
export interface GuestSession {
	sessionId: string;
	startTime: number;
	lastActivity: number;
	limitations: {
		searchCount: number;
		maxSearchPerDay: number;
		viewCount: number;
		maxViewPerDay: number;
	};
	preferences: {
		showTips: boolean;
		dismissedPrompts: string[];
		language: string;
	};
}

/**
 * 游客会话Hook返回类型
 */
export interface UseGuestSessionReturn {
	session: GuestSession | null;
	isLimitReached: (type: "search" | "view") => boolean;
	incrementUsage: (type: "search" | "view") => boolean;
	getRemainingCount: (type: "search" | "view") => number;
	resetSession: () => void;
	updatePreferences: (prefs: Partial<GuestSession["preferences"]>) => void;
	isSessionExpired: () => boolean;
}

/**
 * 默认游客会话配置
 */
const DEFAULT_GUEST_SESSION: Omit<
	GuestSession,
	"sessionId" | "startTime" | "lastActivity"
> = {
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

/**
 * 会话配置常量
 */
const SESSION_CONFIG = {
	STORAGE_KEY: "blacklisthub_guest_session",
	SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2小时
	DAILY_RESET_HOUR: 0, // 每日0点重置
} as const;

/**
 * 生成唯一的会话ID
 */
function generateSessionId(): string {
	return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查是否需要重置每日限制
 */
function shouldResetDaily(lastActivity: number): boolean {
	const now = new Date();
	const lastDate = new Date(lastActivity);

	// 如果是不同的日期，或者已经过了重置时间
	return (
		now.getDate() !== lastDate.getDate() ||
		now.getMonth() !== lastDate.getMonth() ||
		now.getFullYear() !== lastDate.getFullYear()
	);
}

/**
 * 从本地存储加载游客会话
 */
function loadGuestSession(): GuestSession | null {
	try {
		const stored = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
		if (!stored) return null;

		const session: GuestSession = JSON.parse(stored);

		// 检查会话是否过期
		const now = Date.now();
		if (now - session.lastActivity > SESSION_CONFIG.SESSION_TIMEOUT) {
			localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
			return null;
		}

		// 检查是否需要重置每日限制
		if (shouldResetDaily(session.lastActivity)) {
			session.limitations.searchCount = 0;
			session.limitations.viewCount = 0;
		}

		// 更新最后活动时间
		session.lastActivity = now;

		return session;
	} catch (error) {
		console.error("Failed to load guest session:", error);
		localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
		return null;
	}
}

/**
 * 保存游客会话到本地存储
 */
function saveGuestSession(session: GuestSession): void {
	try {
		localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(session));
	} catch (error) {
		console.error("Failed to save guest session:", error);
	}
}

/**
 * 创建新的游客会话
 */
function createGuestSession(): GuestSession {
	const now = Date.now();
	return {
		sessionId: generateSessionId(),
		startTime: now,
		lastActivity: now,
		...DEFAULT_GUEST_SESSION,
	};
}

/**
 * 游客会话管理Hook
 */
export function useGuestSession(): UseGuestSessionReturn {
	const [session, setSession] = useState<GuestSession | null>(null);

	// 初始化会话
	useEffect(() => {
		const existingSession = loadGuestSession();
		if (existingSession) {
			// 检查会话是否有异常状态（比如计数器超过限制）
			const hasAbnormalState =
				existingSession.limitations.searchCount > existingSession.limitations.maxSearchPerDay ||
				existingSession.limitations.viewCount > existingSession.limitations.maxViewPerDay;

			if (hasAbnormalState) {
				console.log("检测到异常的游客会话状态，创建新会话");
				const newSession = createGuestSession();
				setSession(newSession);
				saveGuestSession(newSession);
			} else {
				setSession(existingSession);
				saveGuestSession(existingSession); // 更新最后活动时间
			}
		} else {
			const newSession = createGuestSession();
			setSession(newSession);
			saveGuestSession(newSession);
		}
	}, []);

	// 监听其他标签页的会话变化
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === SESSION_CONFIG.STORAGE_KEY && e.newValue) {
				try {
					const updatedSession: GuestSession = JSON.parse(e.newValue);
					setSession(updatedSession);
				} catch (error) {
					console.error("Failed to sync guest session:", error);
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	// 检查是否达到限制
	const isLimitReached = useCallback(
		(type: "search" | "view"): boolean => {
			if (!session) return false;

			const { limitations } = session;
			switch (type) {
				case "search":
					return limitations.searchCount >= limitations.maxSearchPerDay;
				case "view":
					return limitations.viewCount >= limitations.maxViewPerDay;
				default:
					return false;
			}
		},
		[session],
	);

	// 增加使用次数
	const incrementUsage = useCallback(
		(type: "search" | "view"): boolean => {
			if (!session) return false;

			// 检查是否已达到限制
			if (isLimitReached(type)) {
				return false;
			}

			const updatedSession = {
				...session,
				lastActivity: Date.now(),
				limitations: {
					...session.limitations,
					[type === "search" ? "searchCount" : "viewCount"]:
						session.limitations[
							type === "search" ? "searchCount" : "viewCount"
						] + 1,
				},
			};

			setSession(updatedSession);
			saveGuestSession(updatedSession);
			return true;
		},
		[session, isLimitReached],
	);

	// 获取剩余次数
	const getRemainingCount = useCallback(
		(type: "search" | "view"): number => {
			if (!session) return 0;

			const { limitations } = session;
			switch (type) {
				case "search":
					return Math.max(
						0,
						limitations.maxSearchPerDay - limitations.searchCount,
					);
				case "view":
					return Math.max(0, limitations.maxViewPerDay - limitations.viewCount);
				default:
					return 0;
			}
		},
		[session],
	);

	// 重置会话
	const resetSession = useCallback(() => {
		const newSession = createGuestSession();
		setSession(newSession);
		saveGuestSession(newSession);
	}, []);

	// 更新偏好设置
	const updatePreferences = useCallback(
		(prefs: Partial<GuestSession["preferences"]>) => {
			if (!session) return;

			const updatedSession = {
				...session,
				lastActivity: Date.now(),
				preferences: {
					...session.preferences,
					...prefs,
				},
			};

			setSession(updatedSession);
			saveGuestSession(updatedSession);
		},
		[session],
	);

	// 检查会话是否过期
	const isSessionExpired = useCallback((): boolean => {
		if (!session) return true;

		const now = Date.now();
		return now - session.lastActivity > SESSION_CONFIG.SESSION_TIMEOUT;
	}, [session]);

	return {
		session,
		isLimitReached,
		incrementUsage,
		getRemainingCount,
		resetSession,
		updatePreferences,
		isSessionExpired,
	};
}

/**
 * 游客会话工具函数
 */
export const GuestSessionUtils = {
	/**
	 * 清除所有游客会话数据
	 */
	clearAllData(): void {
		localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
	},

	/**
	 * 获取会话统计信息
	 */
	getSessionStats(): {
		totalSessions: number;
		averageSessionDuration: number;
		totalSearches: number;
		totalViews: number;
	} | null {
		try {
			const session = loadGuestSession();
			if (!session) return null;

			return {
				totalSessions: 1, // 当前实现只跟踪当前会话
				averageSessionDuration: Date.now() - session.startTime,
				totalSearches: session.limitations.searchCount,
				totalViews: session.limitations.viewCount,
			};
		} catch {
			return null;
		}
	},

	/**
	 * 检查是否为新游客
	 */
	isNewGuest(): boolean {
		return !localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
	},
} as const;
