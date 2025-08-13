import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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
	const header =
		"type,value,risk_level,reason_code,reason,source,status,operator,created_at,updated_at,expires_at\n";
	const body = items
		.map((i) =>
			[
				i.type,
				i.value,
				i.risk_level,
				i.reason_code,
				i.reason,
				i.source,
				i.status,
				i.operator,
				new Date(i.created_at).toISOString(),
				new Date(i.updated_at || i.created_at).toISOString(),
				i.expires_at ? new Date(i.expires_at).toISOString() : "",
			]
				.map(escapeCsv)
				.join(","),
		)
		.join("\n");
	const csv = header + body + "\n";
	return new NextResponse(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": "attachment; filename=blacklist.csv",
		},
	});
}

function escapeCsv(value: unknown) {
	const s = String(value ?? "");
	if (s.includes(",") || s.includes("\n") || s.includes('"')) {
		return '"' + s.replaceAll('"', '""') + '"';
	}
	return s;
}
