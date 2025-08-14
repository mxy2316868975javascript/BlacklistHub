/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import type { UserInfo, UserRole } from "@/types/user";

// 类型定义
interface BlacklistDocument {
	_id: string;
	sources?: string[];
	source?: string;
	timeline?: Array<{
		action: string;
		by: string;
		at: Date;
		note?: string;
	}>;
	type?: string;
	value?: string;
	reason?: string;
	reason_code?: string;
	risk_level?: string;
	region?: string | null;
	status?: string;
	note?: string;
	save: () => Promise<BlacklistDocument>;
}

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	await connectDB();
	const { id } = await params;
	const doc = await Blacklist.findById(id).lean();
	if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
	return NextResponse.json(doc);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	await connectDB();
	const { id } = await params;
	await connectDB();
	const body = await request.json().catch(() => ({}));
	const {
		type,
		value,
		reason,
		reason_code,
		risk_level,
		source,
		region,
		status,
		note,
	} = body || {};

	const authHeader = request.headers.get("authorization");
	const cookie = request.headers.get("cookie");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];
	const me = verifyToken<UserInfo>(token);
	if (!me)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const updates: Record<string, unknown> = {};
	if (type) updates.type = type;
	if (value) updates.value = value;
	if (reason) updates.reason = reason;
	if (reason_code) updates.reason_code = reason_code;
	if (risk_level) updates.risk_level = risk_level;
	if (source) {
		updates.source = source;
		updates.sources = { $addToSet: source }; // will handle below
	}
	if (status) updates.status = status;

	const doc = (await Blacklist.findById(id)) as BlacklistDocument | null;
	if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });

	// Transition rules for single-reviewer workflow
	const canTransition = (from: string, to: string, userRole: string) => {
		const allowed: Record<string, string[]> = {
			draft: ["pending", "retracted"],
			pending: ["published", "rejected"],
			published: ["retracted"],
			rejected: ["pending", "retracted"],
			retracted: [],
		};

		// Admin和Super Admin可以直接发布草稿
		if (
			(userRole === "admin" || userRole === "super_admin") &&
			from === "draft" &&
			to === "published"
		) {
			return true;
		}

		return allowed[from]?.includes(to);
	};

	// Role gating for transitions
	const role = (me.role || "reporter").toLowerCase();

	// 检查已发布记录的修改权限
	if (
		doc.status === "published" &&
		role !== "admin" &&
		role !== "super_admin"
	) {
		return NextResponse.json(
			{ message: "权限不足：只有Admin或Super Admin可以修改已发布的记录" },
			{ status: 403 },
		);
	}

	if (status && !canTransition(doc.status || "draft", status, role)) {
		return NextResponse.json(
			{ message: `非法状态流转: ${doc.status} -> ${status}` },
			{ status: 400 },
		);
	}
	if (
		status === "published" ||
		status === "rejected" ||
		status === "retracted"
	) {
		if (!(role === "reviewer" || role === "admin" || role === "super_admin")) {
			return NextResponse.json(
				{ message: "权限不足：需要 Reviewer、Admin 或 Super Admin" },
				{ status: 403 },
			);
		}
	}

	// Apply updates
	if (source) {
		const setSources = new Set([...(doc.sources || []), source]);
		doc.sources = Array.from(setSources);
		doc.source = source;
		doc.timeline = [
			...(doc.timeline || []),
			{
				action: "merge_source",
				by: me.username,
				at: new Date(),
				note: source ? `merge source: ${source}` : undefined,
			},
		];
	}
	if (type) doc.type = type;
	if (value) doc.value = value;
	if (reason) doc.reason = reason;
	if (reason_code) doc.reason_code = reason_code;
	if (risk_level) doc.risk_level = risk_level;
	if (region !== undefined) {
		doc.region = region || null; // 将空字符串转换为 null
	}

	if (status) {
		doc.status = status;
		const actionMap: Record<string, string> = {
			pending: "submit",
			published: "publish",
			rejected: "reject",
			retracted: "retract",
		};
		const action = actionMap[status];
		if (action) {
			doc.timeline = [
				...(doc.timeline || []),
				{ action, by: me.username, at: new Date(), note },
			];
		}
	} else {
		doc.timeline = [
			...(doc.timeline || []),
			{ action: "update", by: me.username, at: new Date(), note },
		];
	}

	const saved = await doc.save();
	return NextResponse.json(saved);
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	await connectDB();
	const authHeader = (request.headers as any).get?.("authorization");
	const cookie = (request as any).headers?.get?.("cookie");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];
	const me = verifyToken<UserInfo>(token);
	if (!me)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	const { id } = await params;
	await Blacklist.findByIdAndDelete(id);
	return NextResponse.json({ ok: true });
}
