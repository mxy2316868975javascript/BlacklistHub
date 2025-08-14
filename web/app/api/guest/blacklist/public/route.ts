import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

// 模拟黑名单数据类型
interface BlacklistItem {
	id: string;
	type: string;
	value: string;
	riskLevel: "low" | "medium" | "high";
	reasonCode: string;
	status: "published" | "pending" | "rejected";
	visibility: "public" | "private";
	sensitive: boolean;
	createdAt: string;
	updatedAt: string;
	// 敏感字段（游客不可见）
	operator?: string;
	internalNotes?: string;
	sourceDetails?: string;
	reviewerNotes?: string;
}

// 游客可见的黑名单数据类型
interface PublicBlacklistItem {
	id: string;
	type: string;
	value: string; // 可能已脱敏
	riskLevel: "low" | "medium" | "high";
	reasonCode: string;
	createdAt: string;
	status: "published";
}

/**
 * 数据脱敏处理 - 适用于失信人员信息
 */
function maskSensitiveData(value: string, type: string): string {
	switch (type.toLowerCase()) {
		case "person": {
			// 个人姓名脱敏：保留姓氏和最后一个字
			if (value.length >= 2) {
				return value.length === 2
					? `${value[0]}*`
					: `${value[0]}${"*".repeat(value.length - 2)}${value[value.length - 1]}`;
			}
			return value;
		}

		case "company": {
			// 企业名称脱敏：保留前2个字和后2个字
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			if (value.length > 4) {
				return `${value.substring(0, 1)}***${value.substring(value.length - 1)}`;
			}
			return value;
		}

		case "organization": {
			// 组织名称脱敏：类似企业名称
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			if (value.length > 4) {
				return `${value.substring(0, 1)}***${value.substring(value.length - 1)}`;
			}
			return value;
		}

		default:
			// 通用脱敏：保留前2位和后2位
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			return value;
	}
}

/**
 * 过滤游客可见的黑名单数据
 */
function filterForGuest(items: any[]): PublicBlacklistItem[] {
	return items
		.filter(
			(item) =>
				item.status === "published" &&
				item.visibility === "public" &&
				!item.sensitive,
		)
		.map((item) => ({
			id: item._id.toString(),
			type: item.type,
			value: maskSensitiveData(item.value, item.type),
			riskLevel: item.risk_level,
			reasonCode: item.reason_code,
			createdAt: item.created_at?.toISOString() || new Date().toISOString(),
			status: "published" as const,
		}));
}

/**
 * 从数据库获取真实的失信数据
 */
async function getBlacklistData(
	page: number,
	pageSize: number,
	search?: string,
	type?: string,
	riskLevel?: string,
) {
	await connectDB();

	// 构建查询条件
	const query: any = {
		status: "published",
		visibility: "public",
		sensitive: { $ne: true },
		expires_at: { $gt: new Date() }, // 只返回未过期的记录
	};

	// 添加类型过滤
	if (type) {
		query.type = type;
	}

	// 添加风险等级过滤
	if (riskLevel) {
		query.risk_level = riskLevel;
	}

	// 添加搜索过滤
	if (search && search.trim()) {
		const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		query.$or = [
			{ value: new RegExp(escapedSearch, "i") },
			{ reason: new RegExp(escapedSearch, "i") },
			{ reason_code: new RegExp(escapedSearch, "i") },
		];
	}

	// 计算跳过的记录数
	const skip = (page - 1) * pageSize;

	// 执行查询
	const [data, total] = await Promise.all([
		Blacklist.find(query)
			.sort({ created_at: -1 })
			.skip(skip)
			.limit(pageSize)
			.lean(),
		Blacklist.countDocuments(query),
	]);

	return { data, total };
}

/**
 * 简单的内存缓存（生产环境应使用Redis）
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getFromCache(key: string): any | null {
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}
	cache.delete(key);
	return null;
}

function setCache(key: string, data: any): void {
	cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = Number.parseInt(searchParams.get("page") || "1");
		const pageSize = Math.min(
			Number.parseInt(searchParams.get("pageSize") || "20"),
			50,
		); // 最大50条
		const search = searchParams.get("search") || "";
		const type = searchParams.get("type") || "";
		const riskLevel = searchParams.get("riskLevel") || "";

		// 验证参数
		if (page < 1 || pageSize < 1) {
			return NextResponse.json(
				{ error: "Invalid pagination parameters" },
				{ status: 400 },
			);
		}

		// 构建缓存键
		const cacheKey = `guest_blacklist_${page}_${pageSize}_${search}_${type}_${riskLevel}`;

		// 尝试从缓存获取
		const cached = getFromCache(cacheKey);
		if (cached) {
			return NextResponse.json(cached);
		}

		// 从数据库获取真实数据
		const { data: rawData, total } = await getBlacklistData(
			page,
			pageSize,
			search,
			type,
			riskLevel,
		);

		// 过滤并脱敏游客可见数据
		const filteredData = filterForGuest(rawData);

		const totalPages = Math.ceil(total / pageSize);

		const response = {
			data: filteredData,
			pagination: {
				page,
				pageSize,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
			filters: {
				search,
				type,
				riskLevel,
			},
			meta: {
				timestamp: new Date().toISOString(),
				source: "guest_api",
				dataVersion: "1.0",
			},
		};

		// 缓存结果
		setCache(cacheKey, response);

		// 设置响应头
		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		headers.set("Cache-Control", "public, max-age=300"); // 5分钟缓存
		headers.set("X-RateLimit-Limit", "100");
		headers.set("X-RateLimit-Remaining", "99");
		headers.set("X-Data-Source", "public");

		return new NextResponse(JSON.stringify(response), {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Guest blacklist API error:", error);

		return NextResponse.json(
			{
				error: "Internal server error",
				message: "Failed to fetch blacklist data",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}

// 游客API不支持POST/PUT/DELETE操作
export async function POST() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message:
				"Guest users cannot create blacklist entries. Please register for full access.",
		},
		{ status: 405 },
	);
}

export async function PUT() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message:
				"Guest users cannot modify blacklist entries. Please register for full access.",
		},
		{ status: 405 },
	);
}

export async function DELETE() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message:
				"Guest users cannot delete blacklist entries. Please register for full access.",
		},
		{ status: 405 },
	);
}
