import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import User from "@/models/User";

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

		// 获取用户信息
		const user = await User.findById(payload.uid);
		if (!user) {
			return NextResponse.json({ message: "User not found" }, { status: 404 });
		}

		// 计算时间范围
		const now = new Date();
		const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const thisWeekStart = new Date(now);
		thisWeekStart.setDate(now.getDate() - now.getDay());

		// 聚合查询用户统计数据
		const [
			totalRecords,
			statusDistribution,
			riskDistribution,
			thisMonthRecords,
			thisWeekRecords,
			publishedRecords,
		] = await Promise.all([
			// 总记录数
			Blacklist.countDocuments({ operator: payload.username }),
			
			// 状态分布
			Blacklist.aggregate([
				{ $match: { operator: payload.username } },
				{ $group: { _id: "$status", count: { $sum: 1 } } },
				{ $project: { status: "$_id", count: 1, _id: 0 } }
			]),
			
			// 风险等级分布
			Blacklist.aggregate([
				{ $match: { operator: payload.username } },
				{ $group: { _id: "$risk_level", count: { $sum: 1 } } },
				{ $project: { risk_level: "$_id", count: 1, _id: 0 } }
			]),
			
			// 本月记录数
			Blacklist.countDocuments({ 
				operator: payload.username,
				created_at: { $gte: thisMonthStart }
			}),
			
			// 本周记录数
			Blacklist.countDocuments({ 
				operator: payload.username,
				created_at: { $gte: thisWeekStart }
			}),
			
			// 已发布记录数
			Blacklist.countDocuments({ 
				operator: payload.username,
				status: "published"
			}),
		]);

		// 转换状态分布数据格式
		const statusDistributionMap = statusDistribution.reduce((acc: any, item: any) => {
			acc[item.status] = item.count;
			return acc;
		}, {});

		// 转换风险等级分布数据格式
		const riskDistributionMap = riskDistribution.reduce((acc: any, item: any) => {
			acc[item.risk_level] = item.count;
			return acc;
		}, {});

		// 计算通过率
		const approvalRate = totalRecords > 0 
			? Math.round((publishedRecords / totalRecords) * 100)
			: 0;

		// 获取最近活跃度数据（简化版）
		const recentActivity = await Blacklist.aggregate([
			{ $match: { operator: payload.username } },
			{ $sort: { created_at: -1 } },
			{ $limit: 30 },
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$created_at"
						}
					},
					count: { $sum: 1 }
				}
			},
			{ $sort: { _id: -1 } }
		]);

		// 构建响应数据
		const stats = {
			// 基本信息
			joinDate: user.created_at || user._id?.getTimestamp?.() || null,
			lastLogin: user.last_login || null,
			
			// 贡献统计
			totalRecords,
			publishedRecords,
			thisMonthRecords,
			thisWeekRecords,
			approvalRate,
			
			// 分布统计
			statusDistribution: statusDistributionMap,
			riskDistribution: riskDistributionMap,
			
			// 活跃度数据
			recentActivity: recentActivity.map((item: any) => ({
				date: item._id,
				count: item.count
			})),
			
			// 数据质量指标（简化版）
			dataQuality: {
				completeness: Math.min(100, Math.round((publishedRecords / Math.max(totalRecords, 1)) * 100)),
				accuracy: approvalRate,
				timeliness: 85 // 固定值，实际应该根据更新频率计算
			}
		};

		return NextResponse.json(stats);

	} catch (error) {
		console.error("User stats API error:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
