import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

interface SearchSuggestion {
	value: string;
	type: string;
	count: number;
	risk_level?: string;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q")?.trim();
		const type = searchParams.get("type");
		const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10);

		if (!query || query.length < 2) {
			return NextResponse.json({ suggestions: [] });
		}

		await connectDB();

		// 构建搜索条件
		const searchConditions: any = {
			status: "published",
			visibility: "public",
		};

		if (type) {
			searchConditions.type = type;
		}

		// 转义特殊字符
		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		searchConditions.value = new RegExp(escapedQuery, "i");

		// 简化的聚合查询获取建议
		const suggestions = await Blacklist.aggregate([
			{ $match: searchConditions },
			{
				$group: {
					_id: {
						value: "$value",
						type: "$type",
					},
					count: { $sum: 1 },
					risk_levels: { $push: "$risk_level" },
				}
			},
			{
				$project: {
					value: "$_id.value",
					type: "$_id.type",
					count: 1,
					// 简化风险等级处理，取第一个
					risk_level: { $arrayElemAt: ["$risk_levels", 0] },
					_id: 0,
				}
			},
			{ $sort: { count: -1, value: 1 } },
			{ $limit: limit }
		]);

		// 数据脱敏处理
		const maskedSuggestions = suggestions.map((suggestion: any) => ({
			...suggestion,
			value: maskSensitiveData(suggestion.value, suggestion.type),
		}));

		return NextResponse.json({
			suggestions: maskedSuggestions,
			query,
			total: suggestions.length,
		});

	} catch (error) {
		console.error("Suggestions API error:", error);
		return NextResponse.json({ suggestions: [] });
	}
}

/**
 * 数据脱敏处理
 */
function maskSensitiveData(value: string, type: string): string {
	switch (type?.toLowerCase()) {
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
