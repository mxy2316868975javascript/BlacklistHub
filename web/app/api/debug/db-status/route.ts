import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export async function GET() {
	try {
		await connectDB();

		// 检查数据库连接和数据
		const [
			totalCount,
			publishedCount,
			typeDistribution,
			statusDistribution,
			sampleData,
		] = await Promise.all([
			Blacklist.countDocuments({}),
			Blacklist.countDocuments({ status: "published" }),
			Blacklist.aggregate([
				{
					$group: {
						_id: "$type",
						count: { $sum: 1 },
					},
				},
			]),
			Blacklist.aggregate([
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
			]),
			Blacklist.find({}).limit(5).lean(),
		]);

		return NextResponse.json({
			success: true,
			database: {
				connected: true,
				totalRecords: totalCount,
				publishedRecords: publishedCount,
			},
			distribution: {
				byType: typeDistribution,
				byStatus: statusDistribution,
			},
			sampleData: sampleData.map((item) => ({
				id: item._id,
				type: item.type,
				value: item.value?.substring(0, 10) + "...", // 只显示前10个字符
				status: item.status,
				risk_level: item.risk_level,
				visibility: item.visibility,
				sensitive: item.sensitive,
				expires_at: item.expires_at,
				created_at: item.created_at,
			})),
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Database status check error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
