import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	await connectDB();
	const { id } = await params;
	const doc = await Blacklist.findById(id).lean();
	if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
	return NextResponse.json(doc);
}
