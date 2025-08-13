import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET() {
	await connectDB();

	// Top reporters (按 operator)
	const topReporters = await Blacklist.aggregate([
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
		{ $limit: 20 },
	]);

	// Top reason codes
	const topReasonCodes = await Blacklist.aggregate([
		{ $group: { _id: "$reason_code", count: { $sum: 1 } } },
		{ $sort: { count: -1 } },
		{ $limit: 20 },
	]);

	return NextResponse.json({ topReporters, topReasonCodes });
}
