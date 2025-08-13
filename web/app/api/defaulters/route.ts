import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

// 聚合失信标的（按 type+value 汇总），支持筛选/分页
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type") || undefined;
	const risk_level = searchParams.get("risk_level") || undefined;
	const page = Number(searchParams.get("page") || 1);
	const pageSize = Number(searchParams.get("pageSize") || 10);
	const sort = (searchParams.get("sort") || "count") as
		| "count"
		| "recent"
		| "risk";
	const range = (searchParams.get("range") || "all") as
		| "all"
		| "week"
		| "month";

	await connectDB();

	const match: Record<string, unknown> = {};
	if (type) match.type = type;
	if (risk_level) match.risk_level = risk_level;
	if (range === "week") {
		const d = new Date();
		d.setDate(d.getDate() - 7);
		(match as any).created_at = { $gte: d };
	} else if (range === "month") {
		const d = new Date();
		d.setDate(d.getDate() - 30);
		(match as any).created_at = { $gte: d };
	}

	const pipeline: any[] = [
		{ $match: match },
		{
			$group: {
				_id: { type: "$type", value: "$value" },
				count: { $sum: 1 },
				lastUpdated: { $max: "$updated_at" },
				risk: {
					$max: {
						$cond: [
							{ $eq: ["$risk_level", "high"] },
							3,
							{ $cond: [{ $eq: ["$risk_level", "medium"] }, 2, 1] },
						],
					},
				},
			},
		},
	];

	if (sort === "count")
		pipeline.push({ $sort: { count: -1, lastUpdated: -1 } });
	else if (sort === "recent") pipeline.push({ $sort: { lastUpdated: -1 } });
	else pipeline.push({ $sort: { risk: -1, lastUpdated: -1, count: -1 } });

	pipeline.push({
		$facet: {
			items: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
			total: [{ $count: "total" }],
		},
	});

	const result = await (Blacklist as any).aggregate(pipeline);
	const items = result[0]?.items || [];
	const total = result[0]?.total?.[0]?.total || 0;

	return NextResponse.json({ items, total });
}
