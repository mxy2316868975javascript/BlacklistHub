import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import User from "@/models/User";

// 公开统计数据类型
interface PublicStats {
	totalBlacklist: number;
	publishedCount: number;
	totalUsers: number;
	typeDistribution: {
		[key: string]: number;
	};
	riskLevelDistribution: {
		low: number;
		medium: number;
		high: number;
	};
	recentActivity: {
		date: string;
		count: number;
	}[];
	topReasonCodes: {
		code: string;
		count: number;
		description: string;
	}[];
}

/**
 * 从数据库获取真实统计数据
 */
async function getRealStats(): Promise<PublicStats> {
	await connectDB();
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	// 并行执行多个统计查询
	const [
		totalBlacklist,
		publishedCount,
		totalUsers,
		typeDistribution,
		riskLevelDistribution,
		recentActivity,
		topReasonCodes,
	] = await Promise.all([
		// 总记录数
		Blacklist.countDocuments({}),

		// 已发布的公开记录数
		Blacklist.countDocuments({
			status: "published",
			visibility: "public",
			expires_at: { $gt: now },
		}),

		// 用户总数
		User.countDocuments({}),

		// 类型分布统计
		Blacklist.aggregate([
			{
				$match: {
					status: "published",
					visibility: "public",
					expires_at: { $gt: now },
				},
			},
			{
				$group: {
					_id: "$type",
					count: { $sum: 1 },
				},
			},
		]),

		// 风险等级分布统计
		Blacklist.aggregate([
			{
				$match: {
					status: "published",
					visibility: "public",
					expires_at: { $gt: now },
				},
			},
			{
				$group: {
					_id: "$risk_level",
					count: { $sum: 1 },
				},
			},
		]),

		// 最近30天活动统计
		Blacklist.aggregate([
			{
				$match: {
					status: "published",
					visibility: "public",
					created_at: { $gte: thirtyDaysAgo },
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$created_at",
						},
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]),

		// 热门原因代码统计
		Blacklist.aggregate([
			{
				$match: {
					status: "published",
					visibility: "public",
					expires_at: { $gt: now },
				},
			},
			{
				$group: {
					_id: "$reason_code",
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: 5 },
		]),
	]);

	// 处理类型分布数据
	const typeDistributionObj: { [key: string]: number } = {};
	typeDistribution.forEach((item: any) => {
		typeDistributionObj[item._id] = item.count;
	});

	// 处理风险等级分布数据
	const riskDistributionObj = {
		low: 0,
		medium: 0,
		high: 0,
	};
	riskLevelDistribution.forEach((item: any) => {
		if (item._id in riskDistributionObj) {
			riskDistributionObj[item._id as keyof typeof riskDistributionObj] =
				item.count;
		}
	});

	// 处理最近活动数据
	const activityMap = new Map();
	recentActivity.forEach((item: any) => {
		activityMap.set(item._id, item.count);
	});

	// 生成完整的30天数据（填充缺失的日期）
	const recentActivityArray = [];
	for (let i = 29; i >= 0; i--) {
		const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
		const dateStr = date.toISOString().split("T")[0];
		recentActivityArray.push({
			date: dateStr,
			count: activityMap.get(dateStr) || 0,
		});
	}

	// 处理热门原因代码数据
	const reasonCodeLabels: { [key: string]: string } = {
		"fraud.payment": "支付欺诈",
		"fraud.chargeback": "拒付欺诈",
		"fraud.identity": "身份欺诈",
		"debt.default": "债务违约",
		"contract.breach": "合同违约",
		"tax.evasion": "税务违法",
		"court.judgment": "法院判决",
		"regulatory.violation": "监管违规",
	};

	const topReasonCodesArray = topReasonCodes.map((item: any) => ({
		code: item._id,
		count: item.count,
		description: reasonCodeLabels[item._id] || item._id,
	}));



	return {
		totalBlacklist,
		publishedCount,
		totalUsers,
		typeDistribution: typeDistributionObj,
		riskLevelDistribution: riskDistributionObj,
		recentActivity: recentActivityArray,
		topReasonCodes: topReasonCodesArray,
	};
}

/**
 * 简单的内存缓存
 */
const statsCache = new Map<string, { data: PublicStats; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存

function getCachedStats(): PublicStats | null {
	const cached = statsCache.get("public_stats");
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}
	statsCache.delete("public_stats");
	return null;
}

function setCachedStats(data: PublicStats): void {
	statsCache.set("public_stats", { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type") || "overview"; // overview, distribution, activity, trends

		// 尝试从缓存获取
		let stats = getCachedStats();
		if (!stats) {
			// 从数据库获取真实统计数据
			stats = await getRealStats();
			setCachedStats(stats);
		}

		// 根据请求类型返回不同的数据
		let response: Record<string, any>;

		switch (type) {
			case "overview":
				response = {
					totalBlacklist: stats.totalBlacklist,
					publishedCount: stats.publishedCount,
					totalUsers: stats.totalUsers,
					lastUpdated: new Date().toISOString(),
				};
				break;

			case "distribution":
				response = {
					typeDistribution: stats.typeDistribution,
					riskLevelDistribution: stats.riskLevelDistribution,
					lastUpdated: new Date().toISOString(),
				};
				break;

			case "activity":
				response = {
					recentActivity: stats.recentActivity.slice(-7), // 最近7天
					topReasonCodes: stats.topReasonCodes.slice(0, 5), // 前5个
					lastUpdated: new Date().toISOString(),
				};
				break;

			case "trends":
				// 游客模式只提供基础趋势数据
				response = {
					totalUsers: stats.totalUsers,
					totalBlacklist: stats.totalBlacklist,
					trend: "stable",
					lastUpdated: new Date().toISOString(),
				};
				break;

			default:
				return NextResponse.json(
					{ error: "Invalid stats type" },
					{ status: 400 },
				);
		}

		// 添加游客模式标识
		const finalResponse = {
			...response,
			meta: {
				source: "guest_stats",
				type,
				isGuestMode: true,
				limitations: {
					message: "游客模式仅显示公开统计数据",
					upgradeMessage: "注册后可查看详细分析和历史趋势",
				},
			},
		};

		// 设置响应头
		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		headers.set("Cache-Control", "public, max-age=600"); // 10分钟缓存
		headers.set("X-Data-Type", "public-stats");
		headers.set("X-Guest-Mode", "true");

		return new NextResponse(JSON.stringify(finalResponse), {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Guest stats API error:", error);

		return NextResponse.json(
			{
				error: "Failed to fetch statistics",
				message: "Unable to retrieve public statistics",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}

// 游客统计API只支持GET请求
export async function POST() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message: "Statistics are read-only for guest users",
		},
		{ status: 405 },
	);
}

export async function PUT() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message: "Statistics are read-only for guest users",
		},
		{ status: 405 },
	);
}

export async function DELETE() {
	return NextResponse.json(
		{
			error: "Method not allowed",
			message: "Statistics are read-only for guest users",
		},
		{ status: 405 },
	);
}
