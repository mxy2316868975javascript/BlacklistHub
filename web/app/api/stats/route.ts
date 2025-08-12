import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET() {
  await connectDB();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [total, today] = await Promise.all([
    Blacklist.countDocuments({}),
    Blacklist.countDocuments({ created_at: { $gte: todayStart } }),
  ]);
  return NextResponse.json({ total, today });
}

