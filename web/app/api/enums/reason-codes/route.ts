import { connectDB } from "@/lib/db";
import ReasonCodeModel from "@/models/ReasonCode";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		await connectDB();
		
		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const active = searchParams.get("active");
		
		const query: any = {};
		if (category) query.category = category;
		if (active !== null) query.is_active = active === "true";
		
		const reasonCodes = await ReasonCodeModel.find(query)
			.sort({ sort_order: 1, name: 1 })
			.lean();
		
		return NextResponse.json({
			success: true,
			data: reasonCodes,
		});
	} catch (error) {
		console.error("Error fetching reason codes:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch reason codes" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		await connectDB();
		
		const body = await request.json();
		const reasonCode = new ReasonCodeModel(body);
		await reasonCode.save();
		
		return NextResponse.json({
			success: true,
			data: reasonCode,
		});
	} catch (error) {
		console.error("Error creating reason code:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create reason code" },
			{ status: 500 }
		);
	}
}
