import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export async function GET() {
	try {
		await connectDB();

		// 获取一条已发布的记录并显示所有字段
		const record = await Blacklist.findOne({ status: "published" }).lean();

		if (!record) {
			return NextResponse.json({
				success: false,
				message: "No published records found",
			});
		}

		// 显示记录的所有字段
		return NextResponse.json({
			success: true,
			record: {
				...record,
				_id: record._id.toString(),
			},
			fields: Object.keys(record),
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Inspect record error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
