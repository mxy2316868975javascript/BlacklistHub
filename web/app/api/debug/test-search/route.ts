import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q") || "";

		await connectDB();

		// 简单的搜索查询
		const searchQuery: any = {
			status: "published",
			visibility: "public",
			sensitive: { $ne: true },
		};

		if (query) {
			searchQuery.value = new RegExp(query, "i");
		}

		const results = await Blacklist.find(searchQuery).limit(10).lean();

		return NextResponse.json({
			success: true,
			query,
			count: results.length,
			results: results.map((item) => ({
				id: item._id.toString(),
				type: item.type,
				value: item.value,
				status: item.status,
				visibility: item.visibility,
				sensitive: item.sensitive,
			})),
		});
	} catch (error) {
		console.error("Test search error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
