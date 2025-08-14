/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

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
	console.log("📖 GET请求 - 返回的文档:", {
		id: doc._id,
		region: doc.region,
		type: doc.type,
		value: doc.value,
	});
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

	console.log("🔍 PUT请求 - 接收到的数据:", {
		id,
		type,
		value,
		reason,
		reason_code,
		risk_level,
		source,
		region,
		status,
		note,
	});

	const authHeader = request.headers.get("authorization");
	const cookie = request.headers.get("cookie");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];
	const me = verifyToken<{ uid: string; username: string; role?: string }>(
		token,
	);
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

		// Admin可以直接发布草稿
		if (userRole === "admin" && from === "draft" && to === "published") {
			return true;
		}

		return allowed[from]?.includes(to);
	};

	// Role gating for transitions
	const role = (me.role || "reporter").toLowerCase();

	// 检查已发布记录的修改权限
	if (doc.status === "published" && role !== "admin") {
		return NextResponse.json(
			{ message: "权限不足：只有Admin可以修改已发布的记录" },
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
		if (!(role === "reviewer" || role === "admin")) {
			return NextResponse.json(
				{ message: "权限不足：需要 Reviewer 或 Admin" },
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
		console.log("🎯 更新地区字段:", {
			原始值: region,
			类型: typeof region,
			处理后: region || null,
			文档当前地区: doc.region,
		});
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
	console.log("💾 保存后的文档:", {
		id: saved._id,
		region: saved.region,
		type: saved.type,
		value: saved.value,
	});
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
	const me = verifyToken<{ uid: string; username: string; role?: string }>(
		token,
	);
	if (!me)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	const { id } = await params;
	await Blacklist.findByIdAndDelete(id);
	return NextResponse.json({ ok: true });
}
