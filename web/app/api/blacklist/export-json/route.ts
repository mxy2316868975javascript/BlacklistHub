import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import type { UserInfo } from "@/types/user";
import { PERMISSIONS } from "@/types/user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	// 权限验证：只有管理员和超级管理员可以导出数据
	const authHeader = request.headers.get("authorization");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: request.cookies.get("token")?.value;
	const me = verifyToken<UserInfo>(token);

	if (!me || !PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(me.role)) {
		return NextResponse.json(
			{ message: "权限不足：需要管理员权限" },
			{ status: 403 },
		);
	}

	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type") || undefined;
	const risk_level = searchParams.get("risk_level") || undefined;
	const keyword = searchParams.get("keyword")?.toLowerCase() || undefined;
	const start = searchParams.get("start") || undefined;
	const end = searchParams.get("end") || undefined;

	await connectDB();
	const q: Record<string, unknown> = {};
	if (type) q.type = type;
	if (risk_level) q.risk_level = risk_level;
	if (start || end) {
		const range: { $gte?: Date; $lte?: Date } = {};
		if (start) range.$gte = new Date(start);
		if (end) range.$lte = new Date(end);
		(q as unknown as { created_at: { $gte?: Date; $lte?: Date } }).created_at =
			range;
	}
	if (keyword)
		q.$or = [
			{ value: new RegExp(keyword, "i") },
			{ reason: new RegExp(keyword, "i") },
			{ reason_code: new RegExp(keyword, "i") },
			{ operator: new RegExp(keyword, "i") },
			{ source: new RegExp(keyword, "i") },
		];

	const items = await Blacklist.find(q).sort({ created_at: -1 }).lean();
	return new NextResponse(JSON.stringify(items), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Content-Disposition": "attachment; filename=blacklist.json",
		},
	});
}
