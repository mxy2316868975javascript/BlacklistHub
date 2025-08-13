import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type") || undefined;
	const value = searchParams.get("value") || undefined;
	if (!type || !value)
		return NextResponse.json(
			{ message: "缺少参数: type/value" },
			{ status: 400 },
		);

	await connectDB();
	const now = new Date();
	const docs = await Blacklist.find({ type, value })
		.sort({ updated_at: -1 })
		.lean();

	const active = docs.filter(
		(d) =>
			d.status === "published" &&
			(!d.expires_at || new Date(d.expires_at) > now),
	);
	const hit = active.length > 0;
	const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
	const risk_level = hit
		? active.reduce(
				(max, d) =>
					riskOrder[d.risk_level as string] > riskOrder[max]
						? (d.risk_level as string)
						: max,
				"low",
			)
		: undefined;
	const latest = docs[0];
	const status = latest?.status;
	const sources = Array.from(
		new Set(docs.flatMap((d: { sources?: string[] }) => d.sources || [])),
	);
	const sources_count = sources.length;
	const updated_at = latest?.updated_at || latest?.created_at;

	return NextResponse.json({
		hit,
		type,
		value,
		risk_level,
		status,
		sources_count,
		updated_at,
	});
}
