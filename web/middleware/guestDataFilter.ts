import { type NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/enums";

// 数据过滤配置
interface DataFilterConfig {
	allowedFields: string[];
	hiddenFields: string[];
	maskedFields: string[];
	maxResults: number;
	requiresAuth: boolean;
}

// 游客数据过滤规则
const GUEST_FILTER_RULES: Record<string, DataFilterConfig> = {
	blacklist: {
		allowedFields: [
			"id",
			"type",
			"value",
			"riskLevel",
			"reasonCode",
			"createdAt",
			"status",
		],
		hiddenFields: [
			"operator",
			"internalNotes",
			"sourceDetails",
			"reviewerNotes",
			"updatedAt",
			"deletedAt",
			"ipAddress",
			"userAgent",
		],
		maskedFields: [
			"value", // 需要脱敏处理
		],
		maxResults: 50,
		requiresAuth: false,
	},
	users: {
		allowedFields: [],
		hiddenFields: ["*"], // 隐藏所有字段
		maskedFields: [],
		maxResults: 0,
		requiresAuth: true,
	},
	system: {
		allowedFields: [],
		hiddenFields: ["*"],
		maskedFields: [],
		maxResults: 0,
		requiresAuth: true,
	},
};

// 脱敏规则
const MASKING_RULES: Record<string, (value: string) => string> = {
	email: (value: string) => {
		const emailMatch = value.match(/^(.{1,2}).*@(.*)$/);
		return emailMatch ? `${emailMatch[1]}***@${emailMatch[2]}` : value;
	},
	phone: (value: string) => {
		const phoneMatch = value.match(/^(\d{3})\d*(\d{4})$/);
		return phoneMatch ? `${phoneMatch[1]}****${phoneMatch[2]}` : value;
	},
	ip: (value: string) => {
		const ipMatch = value.match(/^(\d+\.\d+)\.\d+\.\d+$/);
		return ipMatch ? `${ipMatch[1]}.***.***` : value;
	},
	domain: (value: string) => {
		const domainParts = value.split(".");
		if (domainParts.length > 2) {
			return `${domainParts[0]}***.${domainParts.slice(-2).join(".")}`;
		}
		return value;
	},
	default: (value: string) => {
		if (value.length > 6) {
			return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
		}
		return value;
	},
};

/**
 * 检测数据类型并应用相应的脱敏规则
 */
function maskValue(value: string, type?: string): string {
	if (!value || typeof value !== "string") return value;

	// 根据类型选择脱敏规则
	if (type) {
		const rule = MASKING_RULES[type.toLowerCase()];
		if (rule) return rule(value);
	}

	// 自动检测类型
	if (value.includes("@")) {
		return MASKING_RULES.email(value);
	}

	if (value.match(/^\d+\.\d+\.\d+\.\d+$/)) {
		return MASKING_RULES.ip(value);
	}

	if (value.includes(".") && !value.includes(" ")) {
		return MASKING_RULES.domain(value);
	}

	if (value.match(/^\d{10,}$/)) {
		return MASKING_RULES.phone(value);
	}

	return MASKING_RULES.default(value);
}

/**
 * 过滤单个数据项
 */
function filterDataItem(
	item: Record<string, unknown>,
	config: DataFilterConfig,
	dataType?: string,
): Record<string, unknown> {
	const filtered: Record<string, unknown> = {};

	// 如果隐藏所有字段，返回空对象
	if (config.hiddenFields.includes("*")) {
		return {};
	}

	// 只保留允许的字段
	for (const field of config.allowedFields) {
		if (item[field] !== undefined) {
			let value = item[field];

			// 应用脱敏规则
			if (config.maskedFields.includes(field) && typeof value === "string") {
				value = maskValue(value, dataType);
			}

			filtered[field] = value;
		}
	}

	// 添加游客标识
	filtered._isGuestView = true;
	filtered._dataFiltered = true;

	return filtered;
}

/**
 * 过滤数据数组
 */
function filterDataArray(
	data: Record<string, unknown>[],
	config: DataFilterConfig,
	dataType?: string,
): Record<string, unknown>[] {
	// 限制结果数量
	const limitedData = data.slice(0, config.maxResults);

	// 过滤每个数据项
	return limitedData.map((item) => filterDataItem(item, config, dataType));
}

/**
 * 获取用户角色
 */
function getUserRole(request: NextRequest): UserRole | null {
	// 从请求头或JWT token中获取用户角色
	const authHeader = request.headers.get("authorization");
	const guestHeader = request.headers.get("x-guest-mode");

	if (guestHeader === "true") {
		return UserRole.GUEST;
	}

	if (!authHeader) {
		return UserRole.GUEST; // 默认为游客
	}

	// 这里应该解析JWT token获取用户角色
	// 暂时返回游客角色
	return UserRole.GUEST;
}

/**
 * 检查是否为游客请求
 */
function isGuestRequest(request: NextRequest): boolean {
	const userRole = getUserRole(request);
	return userRole === UserRole.GUEST;
}

/**
 * 游客数据过滤中间件
 */
export function guestDataFilterMiddleware(
	data: unknown,
	dataType: string,
	request: NextRequest,
): unknown {
	// 如果不是游客请求，直接返回原数据
	if (!isGuestRequest(request)) {
		return data;
	}

	// 获取过滤配置
	const config = GUEST_FILTER_RULES[dataType];
	if (!config) {
		// 如果没有配置，默认拒绝访问
		throw new Error(
			`Access denied: No filter configuration for data type '${dataType}'`,
		);
	}

	// 如果需要认证但用户是游客，拒绝访问
	if (config.requiresAuth) {
		throw new Error("Access denied: Authentication required");
	}

	// 处理不同的数据结构
	if (Array.isArray(data)) {
		return filterDataArray(data as Record<string, unknown>[], config, dataType);
	}

	if (data && typeof data === "object") {
		return filterDataItem(data as Record<string, unknown>, config, dataType);
	}

	// 对于基本类型，直接返回
	return data;
}

/**
 * 创建过滤响应的辅助函数
 */
export function createFilteredResponse(
	data: unknown,
	dataType: string,
	request: NextRequest,
	additionalMeta?: Record<string, unknown>,
): NextResponse {
	try {
		const filteredData = guestDataFilterMiddleware(data, dataType, request);
		const isGuest = isGuestRequest(request);

		const response = {
			data: filteredData,
			meta: {
				isGuestMode: isGuest,
				dataType,
				filtered: isGuest,
				timestamp: new Date().toISOString(),
				...additionalMeta,
			},
		};

		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		headers.set("X-Data-Filtered", isGuest ? "true" : "false");
		headers.set("X-Guest-Mode", isGuest ? "true" : "false");

		if (isGuest) {
			headers.set("Cache-Control", "public, max-age=300"); // 游客数据缓存5分钟
		}

		return new NextResponse(JSON.stringify(response), {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Data filter error:", error);

		return NextResponse.json(
			{
				error: "Access denied",
				message:
					error instanceof Error ? error.message : "Data access not allowed",
				isGuestMode: isGuestRequest(request),
			},
			{ status: 403 },
		);
	}
}

/**
 * 验证游客访问权限
 */
export function validateGuestAccess(
	dataType: string,
	request: NextRequest,
): { allowed: boolean; reason?: string } {
	const isGuest = isGuestRequest(request);

	if (!isGuest) {
		return { allowed: true };
	}

	const config = GUEST_FILTER_RULES[dataType];
	if (!config) {
		return {
			allowed: false,
			reason: `No access configuration for data type '${dataType}'`,
		};
	}

	if (config.requiresAuth) {
		return {
			allowed: false,
			reason: "Authentication required for this data type",
		};
	}

	return { allowed: true };
}

/**
 * 获取游客数据限制信息
 */
export function getGuestDataLimitations(dataType: string): {
	maxResults: number;
	allowedFields: string[];
	maskedFields: string[];
} {
	const config = GUEST_FILTER_RULES[dataType];

	if (!config) {
		return {
			maxResults: 0,
			allowedFields: [],
			maskedFields: [],
		};
	}

	return {
		maxResults: config.maxResults,
		allowedFields: config.allowedFields,
		maskedFields: config.maskedFields,
	};
}
