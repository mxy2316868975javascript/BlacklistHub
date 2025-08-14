"use client";

import { message } from "antd";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

interface EditorInstance {
	destroy: () => void;
	setHtml: (html: string) => void;
	getHtml: () => string;
}

interface WangEditorWrapperProps {
	value?: string;
	onChange?: (value: string) => void;
	onHtmlChange?: (html: string) => void; // 新增：HTML内容变化回调
	onImagesChange?: (images: string[]) => void; // 新增：图片列表变化回调
	placeholder?: string;
	height?: number;
	id?: string; // 新增：用于无障碍访问的id属性
}

export default function WangEditorWrapper({
	value = "",
	onChange,
	onHtmlChange,
	onImagesChange,
	placeholder = "请输入详细理由，可以插入图片和格式化文本...",
	height = 300,
	id,
}: WangEditorWrapperProps) {
	const [editor, setEditor] = useState<EditorInstance | null>(null);
	const [html, setHtml] = useState(value);
	const [isClient, setIsClient] = useState(false);
	const [Editor, setEditorComponent] = useState<React.ComponentType<{
		defaultConfig: Record<string, unknown>;
		value: string;
		onCreated: (editor: EditorInstance) => void;
		onChange: (editor: EditorInstance) => void;
		mode: string;
		style: React.CSSProperties;
	}> | null>(null);
	const [Toolbar, setToolbarComponent] = useState<React.ComponentType<{
		editor: EditorInstance | null;
		defaultConfig: Record<string, unknown>;
		mode: string;
		style: React.CSSProperties;
	}> | null>(null);

	// 确保只在客户端运行
	useEffect(() => {
		setIsClient(true);

		// 动态导入 wangEditor 组件
		const loadEditor = async () => {
			try {
				const { Editor: EditorComponent, Toolbar: ToolbarComponent } =
					await import("@wangeditor/editor-for-react");
				// @ts-ignore - CSS import
				await import("@wangeditor/editor/dist/css/style.css");

				setEditorComponent(
					() =>
						EditorComponent as React.ComponentType<{
							defaultConfig: Record<string, unknown>;
							value: string;
							onCreated: (editor: EditorInstance) => void;
							onChange: (editor: EditorInstance) => void;
							mode: string;
							style: React.CSSProperties;
						}>,
				);
				setToolbarComponent(
					() =>
						ToolbarComponent as React.ComponentType<{
							editor: EditorInstance | null;
							defaultConfig: Record<string, unknown>;
							mode: string;
							style: React.CSSProperties;
						}>,
				);
			} catch (error) {
				console.error("Failed to load wangEditor:", error);
			}
		};

		loadEditor();
	}, []);

	// 工具栏配置
	const toolbarConfig = {
		toolbarKeys: [
			"headerSelect",
			"|",
			"bold",
			"italic",
			"underline",
			"through",
			"code",
			"sup",
			"sub",
			"clearStyle",
			"|",
			"color",
			"bgColor",
			"|",
			"fontSize",
			"fontFamily",
			"lineHeight",
			"|",
			"bulletedList",
			"numberedList",
			"todo",
			{
				key: "group-justify",
				title: "对齐",
				iconSvg:
					'<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z"></path></svg>',
				menuKeys: [
					"justifyLeft",
					"justifyRight",
					"justifyCenter",
					"justifyJustify",
				],
			},
			"|",
			"emotion",
			"insertLink",
			{
				key: "group-image",
				title: "图片",
				iconSvg:
					'<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
				menuKeys: ["insertImage", "uploadImage"],
			},
			"insertTable",
			"codeBlock",
			"divider",
			"|",
			"undo",
			"redo",
			"|",
			"fullScreen",
		],
	};

	// 编辑器配置
	const editorConfig = {
		placeholder,
		MENU_CONF: {
			// 配置上传图片
			uploadImage: {
				server: "/api/upload",
				fieldName: "files",
				meta: {},
				metaWithUrl: false,
				headers: {},
				withCredentials: false,
				timeout: 30 * 1000, // 30 秒

				// 自定义上传
				async customUpload(
					file: File,
					insertFn: (url: string, alt: string, href: string) => void,
				) {
					try {
						const formData = new FormData();
						formData.append("files", file);

						const response = await axios.post("/api/upload", formData, {
							headers: { "Content-Type": "multipart/form-data" },
						});

						if (response.data.success && response.data.files.length > 0) {
							const imageUrl = response.data.files[0];
							// 插入图片到编辑器
							insertFn(imageUrl, file.name || "图片", imageUrl);
							message.success("图片上传成功");
						} else {
							throw new Error(response.data.message || "上传失败");
						}
					} catch (error: unknown) {
						console.error("图片上传失败:", error);
						const errorMessage =
							error instanceof Error ? error.message : "图片上传失败";
						message.error(errorMessage);
					}
				},

				// 单个文件的最大体积限制，默认为 2M
				maxFileSize: 5 * 1024 * 1024, // 5M

				// 最多可上传几个文件，默认为 100
				maxNumberOfFiles: 10,

				// 选择文件时的类型限制，默认为 ['image/*'] 。如不想限制，则设置为 []
				allowedFileTypes: ["image/*"],

				// 自定义上传错误
				onError(_file: File, err: unknown, _res: unknown) {
					console.error("上传错误", err);
					message.error("图片上传失败");
				},

				// 上传成功回调
				onSuccess(_file: File, _res: unknown) {
					// 上传成功处理
				},

				// 上传进度的回调函数
				onProgress(_progress: number) {
					// 进度处理
				},

				// 上传之前触发
				onBeforeUpload(file: File) {
					return file;
				},

				// 自定义插入图片
				customInsert(
					res: { success: boolean; files: string[] },
					insertFn: (url: string, alt: string, href: string) => void,
				) {
					if (res.success && res.files && res.files.length > 0) {
						const imageUrl = res.files[0];
						insertFn(imageUrl, "图片", imageUrl);
					}
				},
			},

			// 配置链接
			insertLink: {
				checkLink: (_text: string, url: string) => {
					if (!url) {
						message.warning("请输入链接地址");
						return false;
					}
					return true;
				},
				parseLinkUrl: (url: string) => {
					if (url.indexOf("http") !== 0) {
						return `http://${url}`;
					}
					return url;
				},
			},
		},
	};

	// Markdown 到 HTML 转换（用于初始化编辑器内容）
	const markdownToHtml = useCallback((markdown: string): string => {
		let html = markdown;

		// 转换图片
		html = html.replace(
			/!\[([^\]]*)\]\(([^)]+)\)/g,
			'<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />',
		);

		// 转换链接
		html = html.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
		);

		// 转换粗体
		html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

		// 转换斜体
		html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

		// 转换代码块
		html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

		// 转换行内代码
		html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

		// 转换换行
		html = html.replace(/\n/g, "<br>");

		return html;
	}, []);

	// 及时销毁 editor ，重要！
	useEffect(() => {
		return () => {
			if (editor == null) return;
			editor.destroy();
			setEditor(null);
		};
	}, [editor]);

	// 监听 value 变化，同步到编辑器
	useEffect(() => {
		if (editor == null) return;
		if (value !== html) {
			const htmlContent = markdownToHtml(value);
			setHtml(htmlContent);
			editor.setHtml(htmlContent);
		}
	}, [value, editor, html, markdownToHtml]);

	// 处理编辑器内容变化
	const handleChange = (editor: EditorInstance) => {
		const newHtml = editor.getHtml();
		setHtml(newHtml);

		// 将 HTML 转换为 Markdown 格式存储
		const markdown = htmlToMarkdown(newHtml);
		onChange?.(markdown);

		// 传递 HTML 内容
		onHtmlChange?.(newHtml);

		// 提取图片URL列表
		const images = extractImages(newHtml);
		onImagesChange?.(images);
	};

	// 从HTML中提取图片URL
	const extractImages = (html: string): string[] => {
		const images: string[] = [];
		const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
		let match: RegExpExecArray | null = imgRegex.exec(html);

		while (match !== null) {
			const url = match[1];
			// 只提取我们上传的图片
			if (url.startsWith("/uploads/")) {
				images.push(url);
			}
			match = imgRegex.exec(html);
		}

		return images;
	};

	// 简单的 HTML 到 Markdown 转换
	const htmlToMarkdown = (html: string): string => {
		let markdown = html;

		// 转换图片
		markdown = markdown.replace(
			/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g,
			"![$2]($1)",
		);

		// 转换链接
		markdown = markdown.replace(
			/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
			"[$2]($1)",
		);

		// 转换粗体
		markdown = markdown.replace(/<strong>([^<]+)<\/strong>/g, "**$1**");
		markdown = markdown.replace(/<b>([^<]+)<\/b>/g, "**$1**");

		// 转换斜体
		markdown = markdown.replace(/<em>([^<]+)<\/em>/g, "*$1*");
		markdown = markdown.replace(/<i>([^<]+)<\/i>/g, "*$1*");

		// 转换下划线
		markdown = markdown.replace(/<u>([^<]+)<\/u>/g, "<u>$1</u>");

		// 转换标题
		markdown = markdown.replace(/<h1>([^<]+)<\/h1>/g, "# $1");
		markdown = markdown.replace(/<h2>([^<]+)<\/h2>/g, "## $1");
		markdown = markdown.replace(/<h3>([^<]+)<\/h3>/g, "### $1");

		// 转换列表
		markdown = markdown.replace(/<ul><li>([^<]+)<\/li><\/ul>/g, "- $1");
		markdown = markdown.replace(/<ol><li>([^<]+)<\/li><\/ol>/g, "1. $1");

		// 转换段落和换行
		markdown = markdown.replace(/<p>([^<]+)<\/p>/g, "$1\n");
		markdown = markdown.replace(/<br\s*\/?>/g, "\n");

		// 清理其他HTML标签
		markdown = markdown.replace(/<[^>]+>/g, "");

		// 清理多余的换行
		markdown = markdown.replace(/\n\s*\n/g, "\n\n");
		markdown = markdown.trim();

		return markdown;
	};

	// 初始化时将 Markdown 转换为 HTML
	useEffect(() => {
		if (value && value !== html) {
			const initialHtml = markdownToHtml(value);
			setHtml(initialHtml);
		}
	}, [value, html, markdownToHtml]);

	// 如果还没有加载完成，显示加载状态
	if (!isClient || !Editor || !Toolbar) {
		return (
			<div
				style={{
					height: `${height}px`,
					border: "1px solid #ccc",
					borderRadius: "4px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#f5f5f5",
				}}
			>
				<div>编辑器加载中...</div>
			</div>
		);
	}

	return (
		<div id={id} style={{ border: "1px solid #ccc", zIndex: 100 }}>
			<Toolbar
				editor={editor}
				defaultConfig={toolbarConfig}
				mode="default"
				style={{ borderBottom: "1px solid #ccc" }}
			/>
			<Editor
				defaultConfig={editorConfig}
				value={html}
				onCreated={setEditor}
				onChange={handleChange}
				mode="default"
				style={{ height: `${height}px`, overflowY: "hidden" }}
			/>
		</div>
	);
}
