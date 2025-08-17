import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

// 游客可见的黑名单详情类型
interface PublicBlacklistDetail {
	id: string;
	type: string;
	value: string; // 已脱敏
	riskLevel: "low" | "medium" | "high";
	reasonCode: string;
	reason?: string;
	source?: string;
	region?: string;
	createdAt: string;
	status: "published";
}

/**
 * 数据脱敏处理
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
 * 过滤游客可见的详情数据
 */
function filterDetailForGuest(item: any): PublicBlacklistDetail {
	return {
		id: item._id.toString(),
		type: item.type,
		value: maskSensitiveData(item.value, item.type),
		riskLevel: item.risk_level,
		reasonCode: item.reason_code,
		reason: item.reason || undefined,
		source: item.source || undefined,
		region: item.region || undefined,
		createdAt: item.created_at?.toISOString() || new Date().toISOString(),
		status: "published" as const,
	};
}

/**
 * 从数据库获取单个黑名单详情
 */
async function getBlacklistDetail(id: string) {
	await connectDB();

	// 构建查询条件
	const query = {
		_id: id,
		status: "published",
		visibility: "public",
		sensitive: { $ne: true },
		expires_at: { $gt: new Date() }, // 只返回未过期的记录
	};

	// 执行查询
	const item = await Blacklist.findOne(query).lean();

	return item;
}

/**
 * 简单的内存缓存
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10分钟

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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		// 验证ID格式
		if (!id || typeof id !== "string") {
			return NextResponse.json(
				{ error: "Invalid blacklist ID" },
				{ status: 400 }
			);
		}

		// 验证MongoDB ObjectId格式
		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return NextResponse.json(
				{ error: "Invalid ID format" },
				{ status: 400 }
			);
		}

		// 构建缓存键
		const cacheKey = `guest_blacklist_detail_${id}`;

		// 尝试从缓存获取
		const cached = getFromCache(cacheKey);
		if (cached) {
			return NextResponse.json(cached);
		}

		// 从数据库获取数据
		const rawItem = await getBlacklistDetail(id);

		if (!rawItem) {
			return NextResponse.json(
				{ error: "Blacklist item not found" },
				{ status: 404 }
			);
		}

		// 过滤并脱敏游客可见数据
		const filteredItem = filterDetailForGuest(rawItem);

		// 缓存结果
		setCache(cacheKey, filteredItem);

		// 设置响应头
		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		headers.set("Cache-Control", "public, max-age=600"); // 10分钟缓存
		headers.set("X-Data-Source", "public");
		headers.set("X-Guest-Mode", "true");

		return new NextResponse(JSON.stringify(filteredItem), {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Guest blacklist detail API error:", error);

		return NextResponse.json(
			{
				error: "Internal server error",
				message: "Failed to fetch blacklist detail",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
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
		{ status: 405 }
	);
}

export async function PUT() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message:
				"Guest users cannot modify blacklist entries. Please register for full access.",
		},
		{ status: 405 }
	);
}

export async function DELETE() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message:
				"Guest users cannot delete blacklist entries. Please register for full access.",
		},
		{ status: 405 }
	);
}
