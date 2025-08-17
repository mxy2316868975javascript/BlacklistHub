import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		// 验证用户身份
		const authHeader = req.headers.get("authorization");
		const token = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: req.cookies.get("token")?.value;
		
		const payload = verifyToken<{ uid: string; username: string; role?: string }>(token);
		if (!payload) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// 获取查询参数
		const { searchParams } = new URL(req.url);
		const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
		const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
		const status = searchParams.get("status");
		const riskLevel = searchParams.get("risk_level");
		const skip = (page - 1) * limit;

		// 构建查询条件
		const query: any = { operator: payload.username };
		if (status) query.status = status;
		if (riskLevel) query.risk_level = riskLevel;

		// 查询用户的记录
		const [records, total] = await Promise.all([
			Blacklist.find(query)
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(limit)
				.select({
					_id: 1,
					type: 1,
					value: 1,
					risk_level: 1,
					status: 1,
					reason_code: 1,
					created_at: 1,
					updated_at: 1,
					expires_at: 1
				})
				.lean(),
			
			Blacklist.countDocuments(query)
		]);

		// 数据脱敏处理
		const maskedRecords = records.map((record: any) => ({
			...record,
			value: maskSensitiveData(record.value, record.type),
		}));

		return NextResponse.json({
			records: maskedRecords,
			pagination: {
				current: page,
				pageSize: limit,
				total,
				pages: Math.ceil(total / limit)
			}
		});

	} catch (error) {
		console.error("User records API error:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * 数据脱敏处理
 */
function maskSensitiveData(value: string, type: string): string {
	switch (type?.toLowerCase()) {
		case "person": {
			// 个人姓名脱敏：保留姓氏和最后一个字
			if (value.length >= 2) {
				return value.length === 2
					? `${value[0]}*`
					: `${value[0]}${"*".repeat(value.length - 2)}${value[value.length - 1]}`;
			}
			return value;
		}

		case "company": {
			// 企业名称脱敏：保留前2个字和后2个字
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			if (value.length > 4) {
				return `${value.substring(0, 1)}***${value.substring(value.length - 1)}`;
			}
			return value;
		}

		case "organization": {
			// 组织名称脱敏：类似企业名称
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			if (value.length > 4) {
				return `${value.substring(0, 1)}***${value.substring(value.length - 1)}`;
			}
			return value;
		}

		default:
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			return value;
	}
}
