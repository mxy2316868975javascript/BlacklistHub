import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

// 搜索结果类型
interface SearchResult {
	id: string;
	type: string;
	value: string; // 已脱敏
	riskLevel: "low" | "medium" | "high";
	reasonCode: string;
	createdAt: string;
	matchScore: number; // 匹配度 0-100
	snippet?: string; // 匹配片段
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
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			return value;
	}
}

/**
 * 计算匹配度
 */
function calculateMatchScore(query: string, value: string): number {
	const queryLower = query.toLowerCase();
	const valueLower = value.toLowerCase();

	// 完全匹配
	if (queryLower === valueLower) return 100;

	// 包含匹配
	if (valueLower.includes(queryLower)) return 85;

	// 开头匹配
	if (valueLower.startsWith(queryLower)) return 90;

	// 结尾匹配
	if (valueLower.endsWith(queryLower)) return 80;

	// 模糊匹配（简单实现）
	const commonChars = queryLower
		.split("")
		.filter((char) => valueLower.includes(char)).length;
	return Math.floor((commonChars / queryLower.length) * 70);
}

/**
 * 从数据库搜索真实的失信数据
 */
async function searchBlacklistData(
	query: string,
	limit = 20,
): Promise<SearchResult[]> {
	await connectDB();

	// 构建搜索查询条件
	const searchQuery: any = {
		status: "published",
		visibility: "public",
		sensitive: { $ne: true },
		expires_at: { $gt: new Date() }, // 只返回未过期的记录
	};

	// 转义特殊字符以防止ReDoS攻击
	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// 添加搜索条件 - 简化搜索，只搜索value字段
	if (escapedQuery) {
		searchQuery.value = new RegExp(escapedQuery, "i");
	}

	// 执行数据库查询
	const rawResults = await Blacklist.find(searchQuery)
		.sort({ created_at: -1 })
		.limit(limit)
		.lean();

	// 转换为搜索结果格式并脱敏
	const results: SearchResult[] = rawResults.map((item) => ({
		id: item._id.toString(),
		type: item.type,
		value: maskSensitiveData(item.value, item.type),
		riskLevel: item.risk_level,
		reasonCode: item.reason_code,
		createdAt: item.created_at.toISOString(),
		matchScore: calculateMatchScore(query, item.value),
		snippet: `匹配: ${query}`,
	}));

	// 按匹配度排序
	return results.sort((a, b) => b.matchScore - a.matchScore);
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q")?.trim();
		const limit = Math.min(
			Number.parseInt(searchParams.get("limit") || "20"),
			20,
		); // 游客最多20条结果

		// 验证搜索查询
		if (!query) {
			return NextResponse.json(
				{ error: "Search query is required" },
				{ status: 400 },
			);
		}

		if (query.length < 2) {
			return NextResponse.json(
				{ error: "Search query must be at least 2 characters" },
				{ status: 400 },
			);
		}

		if (query.length > 100) {
			return NextResponse.json(
				{ error: "Search query is too long" },
				{ status: 400 },
			);
		}

		// 构建缓存键
		const cacheKey = `guest_search_${query}_${limit}`;

		// 尝试从缓存获取
		const cached = getFromCache(cacheKey);
		if (cached) {
			return NextResponse.json(cached);
		}

		// 模拟搜索延迟
		await new Promise((resolve) => setTimeout(resolve, 200));

		// 从数据库搜索真实结果
		const results = await searchBlacklistData(query, limit);

		const response = {
			query,
			results,
			total: results.length,
			limit,
			suggestions:
				results.length === 0
					? [`${query}.com`, `mail.${query}`, `${query}.org`]
					: [],
			meta: {
				timestamp: new Date().toISOString(),
				source: "guest_search",
				processingTime: "200ms",
				isGuestMode: true,
			},
		};

		// 缓存结果
		setCache(cacheKey, response);

		// 设置响应头
		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		headers.set("Cache-Control", "public, max-age=300");
		headers.set("X-RateLimit-Limit", "10");
		headers.set("X-RateLimit-Remaining", "9");
		headers.set("X-Search-Type", "guest");

		return new NextResponse(JSON.stringify(response), {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Guest search API error:", error);

		return NextResponse.json(
			{
				error: "Search failed",
				message: "Unable to process search request",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}

// 简单的内存缓存实现
const searchCache = new Map<string, { data: unknown; timestamp: number }>();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getFromCache(key: string): unknown | null {
	const cached = searchCache.get(key);
	if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
		return cached.data;
	}
	searchCache.delete(key);
	return null;
}

function setCache(key: string, data: unknown): void {
	searchCache.set(key, { data, timestamp: Date.now() });
}
