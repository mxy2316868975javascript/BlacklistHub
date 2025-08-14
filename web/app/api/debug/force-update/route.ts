import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function POST() {
	try {
		await connectDB();

		// 使用原生MongoDB操作来强制添加字段
		const db = mongoose.connection.db;
		const collection = db?.collection("blacklists");

		if (!collection) {
			throw new Error("Cannot access blacklists collection");
		}

		// 为所有已发布的记录添加缺失的字段
		const result = await collection.updateMany(
			{ status: "published" },
			{
				$set: {
					visibility: "public",
					sensitive: false,
					expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
				},
			},
		);

		// 检查更新后的记录
		const sampleRecord = await collection.findOne({ status: "published" });

		return NextResponse.json({
			success: true,
			result: {
				matchedCount: result.matchedCount,
				modifiedCount: result.modifiedCount,
			},
			sampleRecord: {
				...sampleRecord,
				_id: sampleRecord?._id?.toString(),
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Force update error:", error);
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
