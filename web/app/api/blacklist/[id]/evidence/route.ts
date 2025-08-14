import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import type { UserInfo } from "@/types/user";

export const runtime = "nodejs";

// 添加证据
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// 权限验证
		const authHeader = request.headers.get("authorization");
		const cookie = request.headers.get("cookie");
		const token = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];

		const user = verifyToken<UserInfo>(token);
		if (!user) {
			return NextResponse.json({ message: "未授权访问" }, { status: 401 });
		}

		await connectDB();
		const { id } = await params;
		const body = await request.json();
		const { images, description } = body;

		if (!images || !Array.isArray(images) || images.length === 0) {
			return NextResponse.json(
				{ message: "请提供至少一张证据图片" },
				{ status: 400 },
			);
		}

		// 查找黑名单记录
		const blacklist = await Blacklist.findById(id);
		if (!blacklist) {
			return NextResponse.json({ message: "记录不存在" }, { status: 404 });
		}

		// 检查权限：只有记录创建者、审核员、管理员可以添加证据
		const canAddEvidence =
			blacklist.operator === user.username ||
			["reviewer", "admin", "super_admin"].includes(user.role || "");

		if (!canAddEvidence) {
			return NextResponse.json(
				{ message: "没有权限添加证据" },
				{ status: 403 },
			);
		}

		// 添加证据
		const newEvidence = {
			images,
			description: description || "",
			uploaded_by: user.username,
			uploaded_at: new Date(),
		};

		blacklist.evidence = blacklist.evidence || [];
		blacklist.evidence.push(newEvidence);

		// 添加时间线记录
		blacklist.timeline = blacklist.timeline || [];
		blacklist.timeline.push({
			action: "add_evidence",
			by: user.username,
			at: new Date(),
			note: `添加了 ${images.length} 张证据图片${description ? `：${description}` : ""}`,
		});

		await blacklist.save();

		return NextResponse.json({
			success: true,
			evidence: newEvidence,
			message: "证据添加成功",
		});
	} catch (error) {
		console.error("添加证据失败:", error);
		return NextResponse.json({ message: "添加证据失败" }, { status: 500 });
	}
}

// 获取证据列表
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await connectDB();
		const { id } = await params;

		const blacklist = await Blacklist.findById(id).select("evidence");
		if (!blacklist) {
			return NextResponse.json({ message: "记录不存在" }, { status: 404 });
		}

		return NextResponse.json({
			evidence: blacklist.evidence || [],
		});
	} catch (error) {
		console.error("获取证据失败:", error);
		return NextResponse.json({ message: "获取证据失败" }, { status: 500 });
	}
}

// 删除证据
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// 权限验证
		const authHeader = request.headers.get("authorization");
		const cookie = request.headers.get("cookie");
		const token = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];

		const user = verifyToken<UserInfo>(token);
		if (!user) {
			return NextResponse.json({ message: "未授权访问" }, { status: 401 });
		}

		await connectDB();
		const { id } = await params;
		const { searchParams } = new URL(request.url);
		const evidenceIndex = searchParams.get("index");

		if (evidenceIndex === null) {
			return NextResponse.json(
				{ message: "请指定要删除的证据索引" },
				{ status: 400 },
			);
		}

		const blacklist = await Blacklist.findById(id);
		if (!blacklist) {
			return NextResponse.json({ message: "记录不存在" }, { status: 404 });
		}

		const index = Number.parseInt(evidenceIndex);
		if (index < 0 || index >= (blacklist.evidence?.length || 0)) {
			return NextResponse.json({ message: "证据索引无效" }, { status: 400 });
		}

		// 检查权限：只有证据上传者、管理员可以删除证据
		const evidence = blacklist.evidence?.[index];
		const canDeleteEvidence =
			evidence?.uploaded_by === user.username ||
			["admin", "super_admin"].includes(user.role || "");

		if (!canDeleteEvidence) {
			return NextResponse.json(
				{ message: "没有权限删除此证据" },
				{ status: 403 },
			);
		}

		// 删除证据
		blacklist.evidence?.splice(index, 1);

		// 添加时间线记录
		blacklist.timeline = blacklist.timeline || [];
		blacklist.timeline.push({
			action: "remove_evidence",
			by: user.username,
			at: new Date(),
			note: `删除了证据 #${index + 1}`,
		});

		await blacklist.save();

		return NextResponse.json({
			success: true,
			message: "证据删除成功",
		});
	} catch (error) {
		console.error("删除证据失败:", error);
		return NextResponse.json({ message: "删除证据失败" }, { status: 500 });
	}
}
