import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

interface EnhancedLookupResult {
	hit: boolean;
	type: string;
	value: string;
	risk_level?: "low" | "medium" | "high";
	status?: string;
	sources_count?: number;
	updated_at?: string;
	records?: Array<{
		id: string;
		reason_code: string;
		created_at: string;
		risk_level: string;
		reason?: string;
	}>;
	summary?: {
		total_records: number;
		active_records: number;
		risk_distribution: Record<string, number>;
		latest_activity: string;
	};
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");
		const value = searchParams.get("value");
		const detailed = searchParams.get("detailed") === "true";

		if (!type || !value) {
			return NextResponse.json(
				{ message: "缺少参数: type/value" },
				{ status: 400 },
			);
		}

		await connectDB();
		const now = new Date();

		// 构建查询条件 - 支持模糊匹配
		const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const searchQuery: any = {
			type,
			status: "published", // 只查询已发布的记录
			$or: [
				{ value: value }, // 精确匹配
				{ value: new RegExp(escapedValue, "i") }, // 模糊匹配
			]
		};

		// 查询所有相关记录
		const allRecords = await Blacklist.find(searchQuery)
			.sort({ updated_at: -1, created_at: -1 })
			.lean();

		// 过滤活跃记录（已发布且未过期）
		const activeRecords = allRecords.filter(
			(record) =>
				record.status === "published" &&
				(!record.expires_at || new Date(record.expires_at) > now),
		);

		const hit = activeRecords.length > 0;

		// 计算风险等级
		const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
		const highestRisk = hit
			? activeRecords.reduce(
					(max, record) =>
						riskOrder[record.risk_level as string] > riskOrder[max]
							? (record.risk_level as string)
							: max,
					"low",
				)
			: undefined;

		// 获取数据来源
		const allSources = Array.from(
			new Set(allRecords.flatMap((record: any) => record.sources || [record.source]).filter(Boolean))
		);

		// 获取最新记录信息
		const latestRecord = allRecords[0];

		// 构建基本结果
		const result: EnhancedLookupResult = {
			hit,
			type,
			value,
			risk_level: highestRisk as "low" | "medium" | "high" | undefined,
			status: latestRecord?.status,
			sources_count: allSources.length,
			updated_at: latestRecord?.updated_at || latestRecord?.created_at,
		};

		// 如果需要详细信息
		if (detailed && hit) {
			// 添加记录详情
			result.records = activeRecords.slice(0, 5).map((record: any) => ({
				id: record._id.toString(),
				reason_code: record.reason_code,
				created_at: record.created_at,
				risk_level: record.risk_level,
				reason: record.reason?.substring(0, 100) + (record.reason?.length > 100 ? "..." : ""),
			}));

			// 添加统计摘要
			const riskDistribution = activeRecords.reduce((acc: Record<string, number>, record: any) => {
				acc[record.risk_level] = (acc[record.risk_level] || 0) + 1;
				return acc;
			}, {});

			result.summary = {
				total_records: allRecords.length,
				active_records: activeRecords.length,
				risk_distribution: riskDistribution,
				latest_activity: latestRecord?.updated_at || latestRecord?.created_at,
			};
		}

		// 设置缓存头
		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		headers.set("Cache-Control", "public, max-age=300"); // 5分钟缓存

		return new NextResponse(JSON.stringify(result), {
			status: 200,
			headers,
		});

	} catch (error) {
		console.error("Enhanced lookup API error:", error);
		return NextResponse.json(
			{
				error: "Lookup failed",
				message: "Unable to process lookup request",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
