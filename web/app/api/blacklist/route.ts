import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  const keyword = searchParams.get("keyword")?.toLowerCase() || undefined;
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  await connectDB();
  const q: Record<string, unknown> = {};
  if (type) q.type = type;
  if (keyword) q.$or = [
    { value: new RegExp(keyword, "i") },
    { reason: new RegExp(keyword, "i") },
    { operator: new RegExp(keyword, "i") },
  ];

  const [items, total] = await Promise.all([
    Blacklist.find(q).sort({ created_at: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Blacklist.countDocuments(q),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { type, value, reason, operator } = body || {};
  if (!type || !value || !reason) return NextResponse.json({ message: "缺少参数" }, { status: 400 });
  await connectDB();
  const doc = await Blacklist.create({ type, value, reason, operator: operator || "admin" });
  return NextResponse.json(doc);
}

