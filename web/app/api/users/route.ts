import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import User from "@/models/User";
import type { UserInfo } from "@/types/user";
import { PERMISSIONS } from "@/types/user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: request.cookies.get("token")?.value;
	const user = verifyToken<UserInfo>(token);
	if (!user || !PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(user.role))
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });

	const { searchParams } = new URL(request.url);
	const keyword = searchParams.get("keyword") || undefined;
	const role = searchParams.get("role") || undefined;
	const page = Number(searchParams.get("page") || 1);
	const pageSize = Number(searchParams.get("pageSize") || 10);

	await connectDB();

	const uq: Record<string, unknown> = {};
	if (role) uq.role = role;
	if (keyword) uq.username = new RegExp(keyword, "i");

	const total = await User.countDocuments(uq);
	const users = await User.find(uq)
		.select({ username: 1, role: 1 })
		.sort({ username: 1 })
		.skip((page - 1) * pageSize)
		.limit(pageSize)
		.lean();

	const usernames = users.map((u) => u.username);
	const stats = usernames.length
		? await Blacklist.aggregate([
				{ $match: { operator: { $in: usernames } } },
				{
					$group: {
						_id: "$operator",
						total: { $sum: 1 },
						published: {
							$sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
						},
					},
				},
			])
		: [];

	const statMap = new Map<string, { total: number; published: number }>();
	for (const s of stats as Array<{
		_id: string;
		total: number;
		published: number;
	}>) {
		statMap.set(s._id, { total: s.total, published: s.published });
	}
	const items = users.map((u) => ({
		...u,
		stats: statMap.get(u.username) || { total: 0, published: 0 },
	}));

	return NextResponse.json({ items, total, page, pageSize });
}
