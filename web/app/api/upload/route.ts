import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { UserInfo } from "@/types/user";

export const runtime = "nodejs";

// 配置文件上传限制
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
];
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "evidence");

export async function POST(request: NextRequest) {
	try {
		// 权限验证
		const authHeader = request.headers.get("authorization");
		const cookie = request.headers.get("cookie");
		const token = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: /(?:^|; )token=([^;]+)/.exec(cookie || "")?.[1];

		const user = verifyToken<UserInfo>(token);
		if (!user) {
			return NextResponse.json({ message: "未授权访问" }, { status: 401 });
		}

		// 确保上传目录存在
		console.log("Upload directory:", UPLOAD_DIR);
		try {
			if (existsSync(UPLOAD_DIR)) {
				console.log("Upload directory already exists");
			} else {
				console.log("Creating upload directory...");
				await mkdir(UPLOAD_DIR, { recursive: true });
				console.log("Upload directory created successfully");
			}
		} catch (error) {
			console.error("Failed to create upload directory:", error);
			return NextResponse.json(
				{ message: "无法创建上传目录" },
				{ status: 500 },
			);
		}

		const formData = await request.formData();
		const files = formData.getAll("files") as File[];

		if (!files || files.length === 0) {
			return NextResponse.json({ message: "没有选择文件" }, { status: 400 });
		}

		if (files.length > 10) {
			return NextResponse.json(
				{ message: "最多只能上传10张图片" },
				{ status: 400 },
			);
		}

		const uploadedFiles: string[] = [];
		const errors: string[] = [];

		for (const file of files) {
			try {
				console.log(
					`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`,
				);

				// 验证文件类型
				if (!ALLOWED_TYPES.includes(file.type)) {
					console.log(`File type not allowed: ${file.type}`);
					errors.push(`${file.name}: 不支持的文件类型`);
					continue;
				}

				// 验证文件大小
				if (file.size > MAX_FILE_SIZE) {
					console.log(`File too large: ${file.size} bytes`);
					errors.push(`${file.name}: 文件大小超过5MB限制`);
					continue;
				}

				// 生成唯一文件名
				const timestamp = Date.now();
				const randomStr = Math.random().toString(36).substring(2);
				const extension = file.name.split(".").pop();
				const fileName = `${timestamp}_${randomStr}.${extension}`;

				// 保存文件
				console.log(`Saving file: ${fileName}`);
				const bytes = await file.arrayBuffer();
				const buffer = Buffer.from(bytes);
				const filePath = join(UPLOAD_DIR, fileName);
				console.log(`File path: ${filePath}`);

				await writeFile(filePath, buffer);
				console.log(`File saved successfully: ${fileName}`);

				// 返回相对URL路径
				const fileUrl = `/uploads/evidence/${fileName}`;
				uploadedFiles.push(fileUrl);
				console.log(`File URL: ${fileUrl}`);
			} catch (error) {
				console.error(`文件上传失败 ${file.name}:`, error);
				const errorMessage =
					error instanceof Error ? error.message : "未知错误";
				errors.push(`${file.name}: ${errorMessage}`);
			}
		}

		return NextResponse.json({
			success: true,
			files: uploadedFiles,
			errors: errors.length > 0 ? errors : undefined,
			message: `成功上传 ${uploadedFiles.length} 个文件${errors.length > 0 ? `，${errors.length} 个文件失败` : ""}`,
		});
	} catch (error) {
		console.error("文件上传错误:", error);
		return NextResponse.json({ message: "文件上传失败" }, { status: 500 });
	}
}

// 获取文件信息
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const fileName = searchParams.get("file");

	if (!fileName) {
		return NextResponse.json({ message: "缺少文件名参数" }, { status: 400 });
	}

	const filePath = join(UPLOAD_DIR, fileName);

	if (!existsSync(filePath)) {
		return NextResponse.json({ message: "文件不存在" }, { status: 404 });
	}

	return NextResponse.json({
		exists: true,
		url: `/uploads/evidence/${fileName}`,
	});
}
