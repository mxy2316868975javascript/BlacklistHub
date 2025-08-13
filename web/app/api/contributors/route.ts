import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const keyword = searchParams.get("keyword") || undefined;
	const page = Number(searchParams.get("page") || 1);
	const pageSize = Number(searchParams.get("pageSize") || 10);

	await connectDB();

	const pipeline: any[] = [
		{
			$group: {
				_id: "$operator",
				total: { $sum: 1 },
				published: {
					$sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
				},
			},
		},
		{ $sort: { total: -1 } },
	];
	if (keyword) {
		pipeline.push({ $match: { _id: new RegExp(keyword, "i") } });
	}
	pipeline.push({
		$facet: {
			items: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
			total: [{ $count: "total" }],
		},
	});

	const agg = await (Blacklist as any).aggregate(pipeline);
	const items = agg?.[0]?.items || [];
	const total = agg?.[0]?.total?.[0]?.total || 0;

	const usernames: string[] = items.map((i: any) => i._id).filter(Boolean);
	const roles = usernames.length
		? await User.find({ username: { $in: usernames } })
				.select({ username: 1, role: 1 })
				.lean()
		: [];
	const roleMap = new Map<string, string>(
		roles.map((u: any) => [u.username, u.role]),
	);

	const mapped = items.map((i: any) => ({
		username: i._id,
		role: roleMap.get(i._id) || "reporter",
		total: i.total,
		published: i.published,
	}));

	return NextResponse.json({ items: mapped, total, page, pageSize });
}
