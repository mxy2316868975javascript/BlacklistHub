/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function PUT(request: Request, context: any) {
  await connectDB();
  const body = await request.json().catch(() => ({}));
  const { type, value, reason, operator } = body || {};
  const doc = await Blacklist.findByIdAndUpdate(
    context.params.id,
    { $set: { type, value, reason, operator } },
    { new: true }
  );
  return NextResponse.json(doc);
}

export async function DELETE(_request: Request, context: any) {
  await connectDB();
  await Blacklist.findByIdAndDelete(context.params.id);
  return NextResponse.json({ ok: true });
}

