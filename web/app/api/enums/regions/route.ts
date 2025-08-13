import { connectDB } from "@/lib/db";
import RegionModel from "@/models/Region";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		await connectDB();
		
		const { searchParams } = new URL(request.url);
		const province = searchParams.get("province");
		const level = searchParams.get("level");
		const active = searchParams.get("active");
		const grouped = searchParams.get("grouped") === "true";
		
		const query: any = {};
		if (province) query.province = province;
		if (level) query.level = level;
		if (active !== null) query.is_active = active === "true";
		
		const regions = await RegionModel.find(query)
			.sort({ sort_order: 1, name: 1 })
			.lean();
		
		if (grouped) {
			// 按省份分组
			const groupedRegions = regions.reduce((acc: any, region: any) => {
				const province = region.province;
				if (!acc[province]) {
					acc[province] = {
						label: province,
						options: [],
					};
				}
				acc[province].options.push({
					label: region.name,
					value: region.code,
				});
				return acc;
			}, {});
			
			return NextResponse.json({
				success: true,
				data: Object.values(groupedRegions),
			});
		}
		
		return NextResponse.json({
			success: true,
			data: regions,
		});
	} catch (error) {
		console.error("Error fetching regions:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch regions" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		await connectDB();
		
		const body = await request.json();
		const region = new RegionModel(body);
		await region.save();
		
		return NextResponse.json({
			success: true,
			data: region,
		});
	} catch (error) {
		console.error("Error creating region:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create region" },
			{ status: 500 }
		);
	}
}
