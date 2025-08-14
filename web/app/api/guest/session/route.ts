import { type NextRequest, NextResponse } from "next/server";

// 游客会话类型
interface GuestSession {
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
	ipAddress: string;
	userAgent: string;
}

// 会话创建请求
interface CreateSessionRequest {
	preferences?: {
		language?: string;
		showTips?: boolean;
	};
}

// 会话更新请求
interface UpdateSessionRequest {
	action:
		| "increment_search"
		| "increment_view"
		| "update_preferences"
		| "dismiss_prompt";
	data?: {
		preferences?: Partial<GuestSession["preferences"]>;
		promptId?: string;
	};
}

/**
 * 生成会话ID
 */
function generateSessionId(): string {
	return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
 * 检查是否需要重置每日限制
 */
function shouldResetDaily(lastActivity: number): boolean {
	const now = new Date();
	const lastDate = new Date(lastActivity);

	return (
		now.getDate() !== lastDate.getDate() ||
		now.getMonth() !== lastDate.getMonth() ||
		now.getFullYear() !== lastDate.getFullYear()
	);
}

/**
 * 简单的内存会话存储（生产环境应使用Redis）
 */
const sessions = new Map<string, GuestSession>();
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2小时

/**
 * 清理过期会话
 */
function cleanupExpiredSessions(): void {
	const now = Date.now();
	for (const [sessionId, session] of sessions.entries()) {
		if (now - session.lastActivity > SESSION_TIMEOUT) {
			sessions.delete(sessionId);
		}
	}
}

// 定期清理过期会话
setInterval(cleanupExpiredSessions, 30 * 60 * 1000); // 每30分钟清理一次

/**
 * 创建新的游客会话
 */
export async function POST(request: NextRequest) {
	try {
		const body: CreateSessionRequest = await request.json().catch(() => ({}));

		const now = Date.now();
		const sessionId = generateSessionId();
		const clientIp = getClientIp(request);
		const userAgent = request.headers.get("user-agent") || "unknown";

		const session: GuestSession = {
			sessionId,
			startTime: now,
			lastActivity: now,
			limitations: {
				searchCount: 0,
				maxSearchPerDay: 10,
				viewCount: 0,
				maxViewPerDay: 50,
			},
			preferences: {
				showTips: body.preferences?.showTips ?? true,
				dismissedPrompts: [],
				language: body.preferences?.language || "zh-CN",
			},
			ipAddress: clientIp,
			userAgent,
		};

		// 存储会话
		sessions.set(sessionId, session);

		// 清理过期会话
		cleanupExpiredSessions();

		const response = {
			sessionId,
			limitations: session.limitations,
			preferences: session.preferences,
			meta: {
				created: new Date(session.startTime).toISOString(),
				expiresIn: SESSION_TIMEOUT,
				maxSessions: 1000, // 最大并发会话数
				currentSessions: sessions.size,
			},
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("Create guest session error:", error);

		return NextResponse.json(
			{
				error: "Failed to create session",
				message: "Unable to create guest session",
			},
			{ status: 500 },
		);
	}
}

/**
 * 获取游客会话信息
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get("sessionId");

		if (!sessionId) {
			return NextResponse.json(
				{ error: "Session ID is required" },
				{ status: 400 },
			);
		}

		const session = sessions.get(sessionId);
		if (!session) {
			return NextResponse.json(
				{ error: "Session not found or expired" },
				{ status: 404 },
			);
		}

		// 检查会话是否过期
		const now = Date.now();
		if (now - session.lastActivity > SESSION_TIMEOUT) {
			sessions.delete(sessionId);
			return NextResponse.json({ error: "Session expired" }, { status: 410 });
		}

		// 检查是否需要重置每日限制
		if (shouldResetDaily(session.lastActivity)) {
			session.limitations.searchCount = 0;
			session.limitations.viewCount = 0;
		}

		// 更新最后活动时间
		session.lastActivity = now;

		const response = {
			sessionId: session.sessionId,
			limitations: session.limitations,
			preferences: session.preferences,
			usage: {
				searchRemaining:
					session.limitations.maxSearchPerDay - session.limitations.searchCount,
				viewRemaining:
					session.limitations.maxViewPerDay - session.limitations.viewCount,
				searchUsagePercent:
					(session.limitations.searchCount /
						session.limitations.maxSearchPerDay) *
					100,
				viewUsagePercent:
					(session.limitations.viewCount / session.limitations.maxViewPerDay) *
					100,
			},
			meta: {
				startTime: new Date(session.startTime).toISOString(),
				lastActivity: new Date(session.lastActivity).toISOString(),
				sessionDuration: now - session.startTime,
				expiresAt: new Date(
					session.lastActivity + SESSION_TIMEOUT,
				).toISOString(),
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Get guest session error:", error);

		return NextResponse.json(
			{
				error: "Failed to get session",
				message: "Unable to retrieve session information",
			},
			{ status: 500 },
		);
	}
}

/**
 * 更新游客会话
 */
export async function PUT(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get("sessionId");
		const body: UpdateSessionRequest = await request.json();

		if (!sessionId) {
			return NextResponse.json(
				{ error: "Session ID is required" },
				{ status: 400 },
			);
		}

		const session = sessions.get(sessionId);
		if (!session) {
			return NextResponse.json(
				{ error: "Session not found or expired" },
				{ status: 404 },
			);
		}

		// 检查会话是否过期
		const now = Date.now();
		if (now - session.lastActivity > SESSION_TIMEOUT) {
			sessions.delete(sessionId);
			return NextResponse.json({ error: "Session expired" }, { status: 410 });
		}

		// 检查是否需要重置每日限制
		if (shouldResetDaily(session.lastActivity)) {
			session.limitations.searchCount = 0;
			session.limitations.viewCount = 0;
		}

		// 处理不同的更新操作
		switch (body.action) {
			case "increment_search":
				if (
					session.limitations.searchCount >= session.limitations.maxSearchPerDay
				) {
					return NextResponse.json(
						{ error: "Search limit exceeded" },
						{ status: 429 },
					);
				}
				session.limitations.searchCount++;
				break;

			case "increment_view":
				if (
					session.limitations.viewCount >= session.limitations.maxViewPerDay
				) {
					return NextResponse.json(
						{ error: "View limit exceeded" },
						{ status: 429 },
					);
				}
				session.limitations.viewCount++;
				break;

			case "update_preferences":
				if (body.data?.preferences) {
					session.preferences = {
						...session.preferences,
						...body.data.preferences,
					};
				}
				break;

			case "dismiss_prompt":
				if (
					body.data?.promptId &&
					!session.preferences.dismissedPrompts.includes(body.data.promptId)
				) {
					session.preferences.dismissedPrompts.push(body.data.promptId);
				}
				break;

			default:
				return NextResponse.json({ error: "Invalid action" }, { status: 400 });
		}

		// 更新最后活动时间
		session.lastActivity = now;

		const response = {
			sessionId: session.sessionId,
			limitations: session.limitations,
			preferences: session.preferences,
			success: true,
			action: body.action,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Update guest session error:", error);

		return NextResponse.json(
			{
				error: "Failed to update session",
				message: "Unable to update session",
			},
			{ status: 500 },
		);
	}
}

/**
 * 删除游客会话
 */
export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get("sessionId");

		if (!sessionId) {
			return NextResponse.json(
				{ error: "Session ID is required" },
				{ status: 400 },
			);
		}

		const deleted = sessions.delete(sessionId);

		if (!deleted) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			message: "Session deleted successfully",
		});
	} catch (error) {
		console.error("Delete guest session error:", error);

		return NextResponse.json(
			{
				error: "Failed to delete session",
				message: "Unable to delete session",
			},
			{ status: 500 },
		);
	}
}
