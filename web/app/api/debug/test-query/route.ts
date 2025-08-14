import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export async function GET() {
	try {
		await connectDB();

		// 测试不同的查询条件
		const queries = [
			{
				name: "只查询published状态",
				query: { status: "published" },
			},
			{
				name: "published + visibility public",
				query: { status: "published", visibility: "public" },
			},
			{
				name: "published + visibility public + not sensitive",
				query: {
					status: "published",
					visibility: "public",
					sensitive: { $ne: true },
				},
			},
			{
				name: "published + visibility public + not sensitive + not expired",
				query: {
					status: "published",
					visibility: "public",
					sensitive: { $ne: true },
					expires_at: { $gt: new Date() },
				},
			},
			{
				name: "published + visibility exists",
				query: { status: "published", visibility: { $exists: true } },
			},
			{
				name: "published + sensitive exists",
				query: { status: "published", sensitive: { $exists: true } },
			},
		];

		const results = [];

		for (const { name, query } of queries) {
			const count = await Blacklist.countDocuments(query);
			const samples = await Blacklist.find(query).limit(2).lean();

			results.push({
				queryName: name,
				count,
				samples: samples.map((item) => ({
					id: item._id,
					type: item.type,
					status: item.status,
					visibility: item.visibility,
					sensitive: item.sensitive,
					expires_at: item.expires_at,
				})),
			});
		}

		return NextResponse.json({
			success: true,
			results,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Test query error:", error);
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
