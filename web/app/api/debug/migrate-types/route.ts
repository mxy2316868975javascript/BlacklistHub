import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export async function POST() {
	try {
		await connectDB();

		// 类型映射：旧类型 -> 新类型
		const typeMapping: { [key: string]: string } = {
			user: "person",
			ip: "organization", // IP地址归类为组织
			email: "person", // 邮箱归类为个人
			phone: "person", // 电话归类为个人
			company: "company", // 保持不变
			domain: "organization", // 域名归类为组织
			other: "other", // 保持不变
		};

		let updatedCount = 0;

		// 批量更新每种类型
		for (const [oldType, newType] of Object.entries(typeMapping)) {
			const result = await Blacklist.updateMany(
				{ type: oldType },
				{ $set: { type: newType } },
			);
			updatedCount += result.modifiedCount;
			console.log(
				`Updated ${result.modifiedCount} records from ${oldType} to ${newType}`,
			);
		}

		// 为所有已发布的记录添加缺失的字段
		const updateFieldsResult = await Blacklist.updateMany(
			{
				status: "published",
			},
			{
				$set: {
					visibility: "public",
					sensitive: false,
					expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
				},
			},
		);

		// 同时将一些draft状态的记录改为published，以便游客能看到更多数据
		const publishResult = await Blacklist.updateMany(
			{
				status: "draft",
				risk_level: { $exists: true }, // 确保有风险等级
			},
			{
				$set: {
					status: "published",
					visibility: "public",
					sensitive: false,
					expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
				},
			},
		);

		// 获取更新后的统计
		const [totalCount, publishedCount, typeDistribution] = await Promise.all([
			Blacklist.countDocuments({}),
			Blacklist.countDocuments({ status: "published" }),
			Blacklist.aggregate([
				{
					$group: {
						_id: "$type",
						count: { $sum: 1 },
					},
				},
			]),
		]);

		return NextResponse.json({
			success: true,
			migration: {
				typesUpdated: updatedCount,
				fieldsUpdated: updateFieldsResult.modifiedCount,
				recordsPublished: publishResult.modifiedCount,
			},
			afterMigration: {
				totalRecords: totalCount,
				publishedRecords: publishedCount,
				typeDistribution,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Migration error:", error);
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
