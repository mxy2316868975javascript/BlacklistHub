import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type") || undefined;
	const risk_level = searchParams.get("risk_level") || undefined;
	const status = searchParams.get("status") || undefined;
	const source = searchParams.get("source") || undefined;
	const reason_code = searchParams.get("reason_code") || undefined;
	const region = searchParams.get("region") || undefined;
	const keyword = searchParams.get("keyword")?.toLowerCase() || undefined;
	const start = searchParams.get("start") || undefined;
	const end = searchParams.get("end") || undefined;
	const page = Number(searchParams.get("page") || 1);
	const pageSize = Number(searchParams.get("pageSize") || 10);

	await connectDB();
	const q: Record<string, unknown> = {};
	if (type) q.type = type;
	if (risk_level) q.risk_level = risk_level;
	if (status) q.status = status;
	if (source) q.source = source;
	if (reason_code) q.reason_code = reason_code;
	if (region) q.region = region;

	// 默认过滤已过期的记录（除非明确请求包含过期记录）
	const includeExpired = searchParams.get("include_expired") === "true";
	if (!includeExpired) {
		q.expires_at = { $gt: new Date() };
	}
	if (start || end) {
		const range: { $gte?: Date; $lte?: Date } = {};
		if (start) range.$gte = new Date(start);
		if (end) range.$lte = new Date(end);
		(q as unknown as { created_at: { $gte?: Date; $lte?: Date } }).created_at =
			range;
	}
	if (keyword) {
		// 转义特殊字符以防止ReDoS攻击
		const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		q.$or = [
			{ value: new RegExp(escapedKeyword, "i") },
			{ reason: new RegExp(escapedKeyword, "i") },
			{ reason_code: new RegExp(escapedKeyword, "i") },
			{ operator: new RegExp(escapedKeyword, "i") },
			{ source: new RegExp(escapedKeyword, "i") },
		];
	}

	const [items, total] = await Promise.all([
		Blacklist.find(q)
			.sort({ updated_at: -1 })
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.lean(),
		Blacklist.countDocuments(q),
	]);

	return NextResponse.json({ items, total });
}

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => ({}));
	const {
		type,
		value,
		reason,
		reason_code,
		risk_level,
		source,
		region,
		expires_at,
	} = body || {};
	// 基本参数验证
	if (!type || !value || !reason || !reason_code || !risk_level)
		return NextResponse.json(
			{ message: "缺少参数: 请提供 类型/值/风险等级/理由码/原因摘要" },
			{ status: 400 },
		);

	// 类型验证
	const validTypes = ["user", "ip", "email", "phone", "domain"];
	const validRiskLevels = ["low", "medium", "high"];
	const validReasonCodes = [
		"fraud.payment",
		"fraud.chargeback",
		"fraud.identity",
		"fraud.account",
		"abuse.spam",
		"abuse.harassment",
		"abuse.phishing",
		"abuse.malware",
		"violation.terms",
		"violation.policy",
		"violation.legal",
		"security.breach",
		"security.suspicious",
		"quality.fake",
		"quality.duplicate",
		"other.manual",
		"other.system",
	];

	if (!validTypes.includes(type))
		return NextResponse.json({ message: "无效的类型" }, { status: 400 });
	if (!validRiskLevels.includes(risk_level))
		return NextResponse.json({ message: "无效的风险等级" }, { status: 400 });
	if (!validReasonCodes.includes(reason_code))
		return NextResponse.json({ message: "无效的理由码" }, { status: 400 });

	// 值的格式验证
	if (typeof value !== "string" || value.length > 500)
		return NextResponse.json({ message: "值格式无效或过长" }, { status: 400 });
	if (typeof reason !== "string" || reason.length > 1000)
		return NextResponse.json({ message: "原因描述过长" }, { status: 400 });

	const authHeader = request.headers.get("authorization");
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.slice(7)
		: request.cookies.get("token")?.value;
	const me = verifyToken<{ uid: string; username: string; role?: string }>(
		token,
	);
	if (!me)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	await connectDB();

	// duplicate check by (type, value, reason_code)
	const existing = await Blacklist.findOne({ type, value, reason_code });
	if (existing) {
		// 检查是否应该合并（考虑地区信息）
		const shouldMerge =
			!region || !existing.region || region === existing.region;

		if (!shouldMerge) {
			// 不同地区，创建新记录而不是合并
			// 跳过合并逻辑，继续创建新记录
		} else {
			// 检查风险等级升级情况
			const riskLevels = { low: 1, medium: 2, high: 3 };
			const existingRisk =
				riskLevels[existing.risk_level as keyof typeof riskLevels] || 1;
			const newRisk = riskLevels[risk_level as keyof typeof riskLevels] || 1;

			// 如果新记录风险等级更高，需要升级现有记录
			const shouldUpgradeRisk = newRisk > existingRisk;
			const updates: Partial<{
				sources: string[];
				source: string;
				risk_level: string;
				reason: string;
				timeline: { action: string; by: string; at: Date; note?: string }[];
			}> = {};

			if (source) {
				const sources = new Set([...(existing.sources || []), source]);
				updates.sources = Array.from(sources);
				updates.source = source; // last source
			}

			// 升级风险等级和原因
			if (shouldUpgradeRisk) {
				updates.risk_level = risk_level;
				updates.reason = reason; // 使用新的更严重的原因
			}
			const oldTimeline =
				(existing.timeline as unknown as {
					action: string;
					by: string;
					at: Date;
					note?: string;
				}[]) || [];
			updates.timeline = [
				...oldTimeline,
				{
					action: shouldUpgradeRisk ? "risk_upgrade" : "merge_source",
					by: me.username,
					at: new Date(),
					note: shouldUpgradeRisk
						? `风险等级升级: ${existing.risk_level} -> ${risk_level}${source ? `, 来源: ${source}` : ""}`
						: source
							? `merge source: ${source}`
							: undefined,
				},
			];
			const doc = await Blacklist.findByIdAndUpdate(
				existing._id,
				{ $set: updates },
				{ new: true },
			).lean();
			return NextResponse.json({ merged: true, doc });
		}
	}

	// 创建新记录
	const exp = expires_at
		? new Date(expires_at)
		: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
	const doc = await Blacklist.create({
		type,
		value,
		reason,
		reason_code,
		risk_level,
		source,
		region: region || null, // 将空字符串转换为 null
		sources: source ? [source] : [],
		operator: me.username,
		expires_at: exp,
		status: "draft",
		timeline: [{ action: "create", by: me.username, at: new Date() }],
	});
	return NextResponse.json({ merged: false, doc });
}
