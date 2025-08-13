import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const doc = await Blacklist.findById(params.id).lean();
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

