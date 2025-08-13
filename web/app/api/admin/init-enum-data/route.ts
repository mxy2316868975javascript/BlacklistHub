import { NextRequest, NextResponse } from "next/server";
import { initEnumData } from "@/scripts/initEnumData";

export async function POST(request: NextRequest) {
	try {
		await initEnumData();
		
		return NextResponse.json({
			success: true,
			message: "Enum data initialized successfully",
		});
	} catch (error) {
		console.error("Error initializing enum data:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to initialize enum data" },
			{ status: 500 }
		);
	}
}
