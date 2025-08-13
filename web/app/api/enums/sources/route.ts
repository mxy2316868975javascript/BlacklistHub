import { connectDB } from "@/lib/db";
import SourceModel from "@/models/Source";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		await connectDB();
		
		const { searchParams } = new URL(request.url);
		const active = searchParams.get("active");
		
		const query: any = {};
		if (active !== null) query.is_active = active === "true";
		
		const sources = await SourceModel.find(query)
			.sort({ sort_order: 1, name: 1 })
			.lean();
		
		return NextResponse.json({
			success: true,
			data: sources,
		});
	} catch (error) {
		console.error("Error fetching sources:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch sources" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		await connectDB();
		
		const body = await request.json();
		const source = new SourceModel(body);
		await source.save();
		
		return NextResponse.json({
			success: true,
			data: source,
		});
	} catch (error) {
		console.error("Error creating source:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create source" },
			{ status: 500 }
		);
	}
}
