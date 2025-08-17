import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { UserRole } from "@/types/user";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => ({}));
	const { username, password } = body || {};
	if (!username || !password)
		return NextResponse.json({ message: "缺少参数" }, { status: 400 });

	await connectDB();
	const user = await User.findOne({ username });
	if (!user)
		return NextResponse.json({ message: "用户不存在" }, { status: 400 });
	const ok = await bcrypt.compare(password, user.password_hash);
	if (!ok) return NextResponse.json({ message: "密码错误" }, { status: 400 });

	// 更新最后登录时间
	await User.findByIdAndUpdate(user._id, {
		last_login: new Date(),
		updated_at: new Date()
	});

	const token = signToken({
		uid: user._id,
		username: user.username,
		role: (user.role as UserRole) || "reporter",
	});
	const res = NextResponse.json({
		token,
		user: {
			username: user.username,
			role: (user.role as UserRole) || "reporter",
		},
	});
	res.cookies.set("token", token, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
	});
	return res;
}
