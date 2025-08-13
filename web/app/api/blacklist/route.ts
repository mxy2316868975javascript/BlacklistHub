import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type") || undefined;
	const risk_level = searchParams.get("risk_level") || undefined;
	const status = searchParams.get("status") || undefined;
	const source = searchParams.get("source") || undefined;
	const reason_code = searchParams.get("reason_code") || undefined;
	const keyword = searchParams.get("keyword")?.toLowerCase() || undefined;
	const start = searchParams.get("start") || undefined;
	const end = searchParams.get("end") || undefined;
	const page = Number(searchParams.get("page") || 1);
	const pageSize = Number(searchParams.get("pageSize") || 10);

	await connectDB();
	const q: Record<string, unknown> = {};
	if (type) q.type = type;
	if (risk_level) q.risk_level = risk_level;
	if (status) q.status = status;
	if (source) q.source = source;
	if (reason_code) q.reason_code = reason_code;
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

	const [items, total] = await Promise.all([
		Blacklist.find(q)
			.sort({ updated_at: -1 })
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.lean(),
		Blacklist.countDocuments(q),
	]);

	return NextResponse.json({ items, total });
}

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => ({}));
	const { type, value, reason, reason_code, risk_level, source, expires_at } =
		body || {};
	if (!type || !value || !reason || !reason_code || !risk_level)
		return NextResponse.json(
			{ message: "缺少参数: 请提供 类型/值/风险等级/理由码/原因摘要" },
			{ status: 400 },
		);

	const authHeader = request.headers.get("authorization");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: request.cookies.get("token")?.value;
	const me = verifyToken<{ uid: string; username: string; role?: string }>(
		token,
	);
	if (!me)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	await connectDB();

	// duplicate check by (type, value, reason_code)
	const existing = await Blacklist.findOne({ type, value, reason_code });
	if (existing) {
		const updates: Partial<{
			sources: string[];
			source: string;
			timeline: { action: string; by: string; at: Date; note?: string }[];
		}> = {};
		if (source) {
			const sources = new Set([...(existing.sources || []), source]);
			updates.sources = Array.from(sources);
			updates.source = source; // last source
		}
		const oldTimeline =
			(existing.timeline as unknown as {
				action: string;
				by: string;
				at: Date;
				note?: string;
			}[]) || [];
		updates.timeline = [
			...oldTimeline,
			{
				action: "merge_source",
				by: me.username,
				at: new Date(),
				note: source ? `merge source: ${source}` : undefined,
			},
		];
		const doc = await Blacklist.findByIdAndUpdate(
			existing._id,
			{ $set: updates },
			{ new: true },
		).lean();
		return NextResponse.json({ merged: true, doc });
	}

	const exp = expires_at
		? new Date(expires_at)
		: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
	const doc = await Blacklist.create({
		type,
		value,
		reason,
		reason_code,
		risk_level,
		source,
		sources: source ? [source] : [],
		operator: me.username,
		expires_at: exp,
		status: "draft",
		timeline: [{ action: "create", by: me.username, at: new Date() }],
	});
	return NextResponse.json({ merged: false, doc });
}
