import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies.get("token")?.value;
  const payload = verifyToken<{ uid: string; username: string }>(token);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: { uid: payload.uid, username: payload.username } });
}

