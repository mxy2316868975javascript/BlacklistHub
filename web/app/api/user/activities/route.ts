import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		// 验证用户身份
		const authHeader = req.headers.get("authorization");
		const token = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: req.cookies.get("token")?.value;
		
		const payload = verifyToken<{ uid: string; username: string; role?: string }>(token);
		if (!payload) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// 获取查询参数
		const { searchParams } = new URL(req.url);
		const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

		// 查询用户的活动记录
		// 这里我们从黑名单记录的时间线中提取活动
		const activities = await Blacklist.aggregate([
			{ $match: { operator: payload.username } },
			{ $unwind: "$timeline" },
			{ $match: { "timeline.by": payload.username } },
			{
				$project: {
					action: "$timeline.action",
					timestamp: "$timeline.at",
					note: "$timeline.note",
					recordId: "$_id",
					recordValue: "$value",
					recordType: "$type"
				}
			},
			{ $sort: { timestamp: -1 } },
			{ $limit: limit }
		]);

		// 格式化活动数据
		const formattedActivities = activities.map((activity: any) => {
			const actionNames: Record<string, string> = {
				create: "创建了记录",
				submit: "提交了记录",
				publish: "发布了记录", 
				reject: "拒绝了记录",
				retract: "撤回了记录",
				update: "更新了记录",
				merge_source: "合并了数据源"
			};

			return {
				action: `${actionNames[activity.action] || activity.action} "${maskValue(activity.recordValue, activity.recordType)}"`,
				timestamp: activity.timestamp,
				note: activity.note,
				recordId: activity.recordId
			};
		});

		// 如果时间线活动不足，补充一些基于记录创建时间的活动
		if (formattedActivities.length < limit) {
			const recentRecords = await Blacklist.find({ operator: payload.username })
				.sort({ created_at: -1 })
				.limit(limit - formattedActivities.length)
				.select({ _id: 1, value: 1, type: 1, created_at: 1, status: 1 })
				.lean();

			const recordActivities = recentRecords.map((record: any) => ({
				action: `创建了记录 "${maskValue(record.value, record.type)}"`,
				timestamp: record.created_at,
				note: null,
				recordId: record._id
			}));

			// 合并并按时间排序
			const allActivities = [...formattedActivities, ...recordActivities]
				.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
				.slice(0, limit);

			return NextResponse.json({
				activities: allActivities,
				total: allActivities.length
			});
		}

		return NextResponse.json({
			activities: formattedActivities,
			total: formattedActivities.length
		});

	} catch (error) {
		console.error("User activities API error:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * 简化的数据脱敏处理
 */
function maskValue(value: string, type: string): string {
	if (!value) return "未知";
	
	if (value.length <= 2) return value;
	
	switch (type?.toLowerCase()) {
		case "person":
			return value.length === 2 
				? `${value[0]}*` 
				: `${value[0]}***${value[value.length - 1]}`;
		case "company":
		case "organization":
			return value.length > 4 
				? `${value.substring(0, 2)}***${value.substring(value.length - 1)}`
				: `${value[0]}***`;
		default:
			return `${value[0]}***${value[value.length - 1]}`;
	}
}
