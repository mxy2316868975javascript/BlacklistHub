import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		await connectDB();
		const body = await request.json();
		const { id, region } = body;

		console.log("🧪 测试API - 接收到的数据:", { id, region });

		// 查找文档
		const doc = await Blacklist.findById(id);
		if (!doc) {
			return NextResponse.json({ error: "Document not found" }, { status: 404 });
		}

		console.log("📄 更新前的文档:", {
			id: doc._id,
			region: doc.region,
			type: doc.type,
			value: doc.value,
		});

		// 更新地区
		doc.region = region;
		const saved = await doc.save();

		console.log("💾 更新后的文档:", {
			id: saved._id,
			region: saved.region,
			type: saved.type,
			value: saved.value,
		});

		// 重新查询验证
		const verified = await Blacklist.findById(id).lean();
		console.log("✅ 验证查询结果:", {
			id: verified?._id,
			region: verified?.region,
			type: verified?.type,
			value: verified?.value,
		});

		return NextResponse.json({
			success: true,
			before: {
				id: doc._id,
				region: doc.region,
			},
			after: {
				id: saved._id,
				region: saved.region,
			},
			verified: {
				id: verified?._id,
				region: verified?.region,
			},
		});
	} catch (error) {
		console.error("❌ 测试API错误:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
