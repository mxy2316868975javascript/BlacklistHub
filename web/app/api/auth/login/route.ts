import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body || {};
  if (!username || !password) return NextResponse.json({ message: "缺少参数" }, { status: 400 });

  await connectDB();
  const user = await User.findOne({ username });
  if (!user) return NextResponse.json({ message: "用户不存在" }, { status: 400 });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ message: "密码错误" }, { status: 400 });

  const token = signToken({ uid: user._id, username: user.username });
  const res = NextResponse.json({ token, user: { username: user.username } });
  res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}

