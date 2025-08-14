"use client";

import { Image } from "antd";
import { useMemo } from "react";

interface MarkdownRendererProps {
	content: string;
	className?: string;
}

// Helper function to parse and render text content safely
function parseTextContent(text: string): React.ReactNode[] {
	if (!text) return [];

	const elements: React.ReactNode[] = [];
	let elementKey = 0;

	// Process links first [text](url)
	const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	match = linkRegex.exec(text);
	while (match !== null) {
		// Add text before link
		if (match.index > lastIndex) {
			const beforeText = text.substring(lastIndex, match.index);
			if (beforeText) {
				elements.push(...parseInlineFormatting(beforeText, elementKey++));
			}
		}

		// Add link
		elements.push(
			<a
				key={`link-${elementKey++}`}
				href={match[2]}
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-600 hover:text-blue-800 underline"
			>
				{match[1]}
			</a>,
		);

		lastIndex = match.index + match[0].length;
		match = linkRegex.exec(text);
	}

	// Add remaining text
	if (lastIndex < text.length) {
		const remainingText = text.substring(lastIndex);
		if (remainingText) {
			elements.push(...parseInlineFormatting(remainingText, elementKey++));
		}
	}

	// If no links were found, just parse inline formatting
	if (elements.length === 0) {
		elements.push(...parseInlineFormatting(text, elementKey++));
	}

	return elements;
}

// Helper function to parse inline formatting (bold, italic, underline)
function parseInlineFormatting(
	text: string,
	baseKey: number,
): React.ReactNode[] {
	const elements: React.ReactNode[] = [];

	// Split by line breaks first
	const lines = text.split("\n");
	let brCounter = 0;

	lines.forEach((line, lineIndex) => {
		if (lineIndex > 0) {
			elements.push(<br key={`br-${baseKey}-${++brCounter}`} />);
		}

		const lineElements: React.ReactNode[] = [];
		let lastIndex = 0;

		// Process bold **text**
		const boldRegex = /\*\*([^*]+)\*\*/g;
		let match: RegExpExecArray | null;

		match = boldRegex.exec(line);
		while (match !== null) {
			// Add text before bold
			if (match.index > lastIndex) {
				const beforeText = line.substring(lastIndex, match.index);
				if (beforeText) {
					lineElements.push(beforeText);
				}
			}

			// Add bold text
			lineElements.push(
				<strong
					key={`bold-${baseKey}-${lineIndex}-${match.index}`}
					className="font-bold"
				>
					{match[1]}
				</strong>,
			);

			lastIndex = match.index + match[0].length;
			match = boldRegex.exec(line);
		}

		// Add remaining text
		if (lastIndex < line.length) {
			const remainingText = line.substring(lastIndex);
			if (remainingText) {
				// Process italic and underline in remaining text
				lineElements.push(
					...parseItalicAndUnderline(
						remainingText,
						`${baseKey}-${lineIndex}-remaining`,
					),
				);
			}
		}

		// If no bold formatting found, process italic and underline
		if (lineElements.length === 0 && line) {
			lineElements.push(
				...parseItalicAndUnderline(line, `${baseKey}-${lineIndex}`),
			);
		}

		elements.push(...lineElements);
	});

	return elements;
}

// Helper function to parse italic and underline formatting
function parseItalicAndUnderline(
	text: string,
	baseKey: string,
): React.ReactNode[] {
	const elements: React.ReactNode[] = [];
	let lastIndex = 0;

	// Process italic *text*
	const italicRegex = /\*([^*]+)\*/g;
	let match: RegExpExecArray | null;

	match = italicRegex.exec(text);
	while (match !== null) {
		// Add text before italic
		if (match.index > lastIndex) {
			const beforeText = text.substring(lastIndex, match.index);
			if (beforeText) {
				elements.push(
					...parseUnderline(beforeText, `${baseKey}-before-${match.index}`),
				);
			}
		}

		// Add italic text
		elements.push(
			<em key={`italic-${baseKey}-${match.index}`} className="italic">
				{match[1]}
			</em>,
		);

		lastIndex = match.index + match[0].length;
		match = italicRegex.exec(text);
	}

	// Add remaining text
	if (lastIndex < text.length) {
		const remainingText = text.substring(lastIndex);
		if (remainingText) {
			elements.push(...parseUnderline(remainingText, `${baseKey}-remaining`));
		}
	}

	// If no italic formatting found, process underline
	if (elements.length === 0 && text) {
		elements.push(...parseUnderline(text, baseKey));
	}

	return elements;
}

// Helper function to parse underline formatting
function parseUnderline(text: string, baseKey: string): React.ReactNode[] {
	const elements: React.ReactNode[] = [];
	let lastIndex = 0;

	// Process underline <u>text</u>
	const underlineRegex = /<u>([^<]+)<\/u>/g;
	let match: RegExpExecArray | null;

	match = underlineRegex.exec(text);
	while (match !== null) {
		// Add text before underline
		if (match.index > lastIndex) {
			const beforeText = text.substring(lastIndex, match.index);
			if (beforeText) {
				elements.push(beforeText);
			}
		}

		// Add underlined text
		elements.push(
			<u key={`underline-${baseKey}-${match.index}`} className="underline">
				{match[1]}
			</u>,
		);

		lastIndex = match.index + match[0].length;
		match = underlineRegex.exec(text);
	}

	// Add remaining text
	if (lastIndex < text.length) {
		const remainingText = text.substring(lastIndex);
		if (remainingText) {
			elements.push(remainingText);
		}
	}

	// If no underline formatting found, return the text as is
	if (elements.length === 0 && text) {
		elements.push(text);
	}

	return elements;
}

export default function MarkdownRenderer({
	content,
	className = "",
}: MarkdownRendererProps) {
	// 安全地渲染不包含图片的内容
	const renderedElements = useMemo(() => {
		if (!content) return [];

		// 处理列表
		const processedContent = processLists(content);
		return parseTextContent(processedContent);
	}, [content]);

	// 如果内容包含图片，使用特殊处理
	const hasImages = content.includes("![");

	if (hasImages) {
		return (
			<div className={`markdown-content ${className}`}>
				<ImageAwareRenderer content={content} />
			</div>
		);
	}

	return (
		<div className={`markdown-content prose prose-sm max-w-none ${className}`}>
			{renderedElements}
		</div>
	);
}

// Helper function to process lists
function processLists(text: string): string {
	let processedText = text;

	// 处理有序列表
	const orderedListRegex = /^(\d+\.\s+.+)$/gm;
	const orderedMatches = processedText.match(orderedListRegex);
	if (orderedMatches) {
		const listItems = orderedMatches
			.map((item) => item.replace(/^\d+\.\s+/, "• "))
			.join("\n");
		processedText = processedText.replace(orderedListRegex, "");
		processedText = `${processedText}\n${listItems}`;
	}

	// 处理无序列表
	const unorderedListRegex = /^(-\s+.+)$/gm;
	const unorderedMatches = processedText.match(unorderedListRegex);
	if (unorderedMatches) {
		const listItems = unorderedMatches
			.map((item) => item.replace(/^-\s+/, "• "))
			.join("\n");
		processedText = processedText.replace(unorderedListRegex, "");
		processedText = `${processedText}\n${listItems}`;
	}

	return processedText;
}

// 专门处理包含图片的内容
function ImageAwareRenderer({ content }: { content: string }) {
	const parts = useMemo(() => {
		const parts: Array<{
			type: "text" | "image";
			content: string;
			alt?: string;
			url?: string;
		}> = [];
		let lastIndex = 0;

		// 查找所有图片
		const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
		let match: RegExpExecArray | null;

		match = imageRegex.exec(content);
		while (match !== null) {
			// 添加图片前的文本
			if (match.index > lastIndex) {
				const textContent = content.substring(lastIndex, match.index);
				if (textContent.trim()) {
					parts.push({ type: "text", content: textContent });
				}
			}

			// 添加图片
			parts.push({
				type: "image",
				content: match[0],
				alt: match[1],
				url: match[2],
			});

			lastIndex = match.index + match[0].length;
			match = imageRegex.exec(content);
		}

		// 添加最后的文本
		if (lastIndex < content.length) {
			const textContent = content.substring(lastIndex);
			if (textContent.trim()) {
				parts.push({ type: "text", content: textContent });
			}
		}

		return parts;
	}, [content]);

	const renderTextContent = (text: string) => {
		// 处理列表
		const processedContent = processLists(text);
		return parseTextContent(processedContent);
	};

	return (
		<div className="space-y-2">
			{parts.map((part, index) => {
				// Create a stable key based on content and type
				const key =
					part.type === "image"
						? `image-${part.url}-${index}`
						: `text-${part.content.slice(0, 50)}-${index}`;

				if (part.type === "image") {
					return (
						<div key={key} className="my-3">
							<Image
								src={part.url}
								alt={part.alt || "图片"}
								className="max-w-full rounded border"
								style={{ maxHeight: "400px" }}
								preview={{
									mask: "点击预览",
								}}
							/>
							{part.alt && (
								<p className="text-sm text-gray-500 text-center mt-1">
									{part.alt}
								</p>
							)}
						</div>
					);
				} else {
					const renderedElements = renderTextContent(part.content);
					return (
						<div key={key} className="prose prose-sm max-w-none">
							{renderedElements}
						</div>
					);
				}
			})}
		</div>
	);
}
