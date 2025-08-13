/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const doc = await Blacklist.findById(id).lean();
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  await connectDB();
  const body = await request.json().catch(() => ({}));
  const { type, value, reason, reason_code, risk_level, source, status, note } = body || {};

  const authHeader = (request.headers as any).get?.("authorization");
  const cookie = (request as any).headers?.get?.("cookie");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];
  const me = verifyToken<{ uid: string; username: string; role?: string }>(token);
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const updates: any = {};
  if (type) updates.type = type;
  if (value) updates.value = value;
  if (reason) updates.reason = reason;
  if (reason_code) updates.reason_code = reason_code;
  if (risk_level) updates.risk_level = risk_level;
  if (source) {
    updates.source = source;
    updates.sources = { $addToSet: source } as any; // will handle below
  }
  if (status) updates.status = status;

  const doc = await Blacklist.findById(id);
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Transition rules for single-reviewer workflow
  const canTransition = (from: string, to: string) => {
    const allowed: Record<string, string[]> = {
      draft: ["pending", "retracted"],
      pending: ["published", "rejected"],
      published: ["retracted"],
      rejected: ["pending", "retracted"],
      retracted: [],
    };
    return allowed[from]?.includes(to);
  };

  if (status && !canTransition(doc.status, status)) {
    return NextResponse.json({ message: `非法状态流转: ${doc.status} -> ${status}` }, { status: 400 });
  }
  // Role gating for transitions
  const role = (me.role || "reporter").toLowerCase();
  if (status === "published" || status === "rejected" || status === "retracted") {
    if (!(role === "reviewer" || role === "admin")) {
      return NextResponse.json({ message: "权限不足：需要 Reviewer 或 Admin" }, { status: 403 });
    }
  }

  // Apply updates
  if (source) {
    const setSources = new Set([...(doc.sources || []), source]);
    (doc as any).sources = Array.from(setSources);
    (doc as any).source = source;
    (doc as any).timeline = [
      ...(doc.timeline || []),
      { action: "merge_source", by: me.username, at: new Date(), note: source ? `merge source: ${source}` : undefined },
    ];
  }
  if (type) (doc as any).type = type;
  if (value) (doc as any).value = value;
  if (reason) (doc as any).reason = reason;
  if (reason_code) (doc as any).reason_code = reason_code;
  if (risk_level) (doc as any).risk_level = risk_level;

  if (status) {
    (doc as any).status = status;
    const actionMap: Record<string, string> = {
      pending: "submit",
      published: "publish",
      rejected: "reject",
      retracted: "retract",
    };
    const action = actionMap[status];
    if (action) {
      (doc as any).timeline = [
        ...(doc.timeline || []),
        { action, by: me.username, at: new Date(), note },
      ];
    }
  } else {
    (doc as any).timeline = [
      ...(doc.timeline || []),
      { action: "update", by: me.username, at: new Date(), note },
    ];
  }

  const saved = await doc.save();
  return NextResponse.json(saved);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const authHeader = (request.headers as any).get?.("authorization");
  const cookie = (request as any).headers?.get?.("cookie");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];
  const me = verifyToken<{ uid: string; username: string; role?: string }>(token);
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await Blacklist.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

