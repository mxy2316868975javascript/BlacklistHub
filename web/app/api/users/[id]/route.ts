/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { UserInfo } from "@/types/user";
import { PERMISSIONS } from "@/types/user";

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
	const me = verifyToken<UserInfo>(token);
	if (!me || !PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(me.role))
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

export async function DELETE(
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
	const me = verifyToken<UserInfo>(token);
	if (!me || !PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(me.role))
		return NextResponse.json({ message: "Forbidden" }, { status: 403 });

	await connectDB();
	const { id } = await params;

	// 防止删除自己
	if (me.uid === id) {
		return NextResponse.json(
			{ message: "不能删除自己的账户" },
			{ status: 400 },
		);
	}

	// 检查用户是否存在
	const user = await User.findById(id);
	if (!user) {
		return NextResponse.json({ message: "用户不存在" }, { status: 404 });
	}

	// 检查是否有权限删除该用户
	if (!PERMISSIONS.CAN_DELETE_USER_BY_ROLE(me.role, user.role as any)) {
		return NextResponse.json(
			{ message: "您没有权限删除该用户" },
			{ status: 403 },
		);
	}

	// 删除用户
	await User.findByIdAndDelete(id);

	return NextResponse.json({ message: "用户删除成功" });
}
