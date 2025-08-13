/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const runtime = "nodejs";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authHeader = (request.headers as unknown as Headers).get?.(
		"authorization",
	);
	const cookie = (request.headers as unknown as Headers).get?.("cookie");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];
	const me = verifyToken<{ uid: string; username: string; role?: string }>(
		token,
	);
	if (!me || (me.role || "reporter") !== "admin")
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });

	const body = await request.json().catch(() => ({}));
	const { role } = body as { role?: "reporter" | "reviewer" | "admin" };
	if (!role)
		return NextResponse.json({ message: "缺少参数: role" }, { status: 400 });

	await connectDB();
	const { id } = await params;
	const doc = await User.findByIdAndUpdate(
		id,
		{ $set: { role } },
		{ new: true },
	).select({ username: 1, role: 1 });
	return NextResponse.json(doc);
}
