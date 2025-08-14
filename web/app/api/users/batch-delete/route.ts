/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { UserInfo } from "@/types/user";
import { PERMISSIONS } from "@/types/user";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
	const { userIds } = body as { userIds?: string[] };

	if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
		return NextResponse.json({ message: "缺少参数: userIds" }, { status: 400 });
	}

	// 防止删除自己
	if (userIds.includes(me.uid)) {
		return NextResponse.json(
			{ message: "不能删除自己的账户" },
			{ status: 400 },
		);
	}

	await connectDB();

	try {
		// 检查要删除的用户是否存在，并验证权限
		const existingUsers = await User.find({ _id: { $in: userIds } }).select({
			_id: 1,
			username: 1,
			role: 1,
		});

		if (existingUsers.length !== userIds.length) {
			const existingIds = existingUsers.map((u) => u._id.toString());
			const notFoundIds = userIds.filter((id) => !existingIds.includes(id));
			return NextResponse.json(
				{ message: `用户不存在: ${notFoundIds.join(", ")}` },
				{ status: 404 },
			);
		}

		// 检查是否有权限删除所有选中的用户
		const unauthorizedUsers = existingUsers.filter(
			(user) => !PERMISSIONS.CAN_DELETE_USER_BY_ROLE(me.role, user.role as any),
		);

		if (unauthorizedUsers.length > 0) {
			const unauthorizedUsernames = unauthorizedUsers
				.map((u) => u.username)
				.join("、");
			return NextResponse.json(
				{
					message: `您没有权限删除以下用户: ${unauthorizedUsernames}`,
				},
				{ status: 403 },
			);
		}

		// 批量删除用户
		const result = await User.deleteMany({ _id: { $in: userIds } });

		return NextResponse.json({
			message: `成功删除 ${result.deletedCount} 个用户`,
			deletedCount: result.deletedCount,
			deletedUsers: existingUsers.map((u) => ({
				id: u._id,
				username: u.username,
			})),
		});
	} catch (error) {
		console.error("批量删除用户失败:", error);
		return NextResponse.json({ message: "批量删除失败" }, { status: 500 });
	}
}
