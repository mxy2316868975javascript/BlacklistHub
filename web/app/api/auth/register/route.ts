import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body || {};
  if (!username || !password) return NextResponse.json({ message: "缺少参数" }, { status: 400 });

  await connectDB();
  const exists = await User.findOne({ username });
  if (exists) return NextResponse.json({ message: "用户名已存在" }, { status: 400 });

  const password_hash = await bcrypt.hash(password, 10);
  await User.create({ username, password_hash });
  return NextResponse.json({ ok: true });
}

