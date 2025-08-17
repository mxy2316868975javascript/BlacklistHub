import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET() {
	try {
		await connectDB();

		// 计算时间范围
		const now = new Date();
		const todayStart = new Date(now);
		todayStart.setHours(0, 0, 0, 0);
		const thisWeekStart = new Date(now);
		thisWeekStart.setDate(now.getDate() - now.getDay());
		const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		// 并行查询各种统计数据
		const [
			total,
			published,
			today,
			thisWeek,
			thisMonth,
			pending,
			highRisk
		] = await Promise.all([
			// 总记录数
			Blacklist.countDocuments({}),

			// 已发布记录数
			Blacklist.countDocuments({ status: "published" }),

			// 今日新增
			Blacklist.countDocuments({
				created_at: { $gte: todayStart }
			}),

			// 本周新增
			Blacklist.countDocuments({
				created_at: { $gte: thisWeekStart }
			}),

			// 本月新增
			Blacklist.countDocuments({
				created_at: { $gte: thisMonthStart }
			}),

			// 待审核记录数
			Blacklist.countDocuments({ status: "pending" }),

			// 高风险记录数
			Blacklist.countDocuments({
				status: "published",
				risk_level: "high"
			})
		]);

		return NextResponse.json({
			total,
			published,
			today,
			thisWeek,
			thisMonth,
			pending,
			highRisk,
			// 计算一些比率
			publishRate: total > 0 ? Math.round((published / total) * 100) : 0,
			highRiskRate: published > 0 ? Math.round((highRisk / published) * 100) : 0
		});
	} catch (error) {
		console.error("Stats API error:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
