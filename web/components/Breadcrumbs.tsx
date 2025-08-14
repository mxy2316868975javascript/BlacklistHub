"use client";
import { EllipsisOutlined, HomeOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Breadcrumb, Dropdown } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
	dashboard: "仪表盘",
	blacklist: "黑名单",
};

function toLabel(segment: string) {
	return labelMap[segment] || decodeURIComponent(segment);
}

export default function Breadcrumbs() {
	const pathname = usePathname() || "/";
	const parts = pathname.split("/").filter(Boolean);

	if (parts.length === 0) return null;

	const homeItem = {
		title: (
			<Link href="/">
				<HomeOutlined />
			</Link>
		),
	};

	const items = (() => {
		if (parts.length <= 2) {
			// home + each segment
			return [
				homeItem,
				...parts.map((part, idx) => {
					const href = "/" + parts.slice(0, idx + 1).join("/");
					const isLast = idx === parts.length - 1;
					return {
						title: isLast ? (
							<span>{toLabel(part)}</span>
						) : (
							<Link href={href}>{toLabel(part)}</Link>
						),
					};
				}),
			];
		}

		// Collapse middle parts into a dropdown when path is long
		const first = parts[0];
		const middle = parts.slice(1, -1);
		const last = parts[parts.length - 1];

		const menuItems: MenuProps["items"] = middle.map((part, idx) => {
			const href = "/" + parts.slice(0, 1 + idx + 1).join("/");
			return { key: href, label: <Link href={href}>{toLabel(part)}</Link> };
		});

		return [
			homeItem,
			{ title: <Link href={`/${first}`}>{toLabel(first)}</Link> },
			{
				title: (
					<Dropdown menu={{ items: menuItems }}>
						<span className="cursor-pointer text-neutral-500 hover:text-neutral-700 align-middle inline-flex items-center">
							<EllipsisOutlined />
						</span>
					</Dropdown>
				),
			},
			{ title: <span>{toLabel(last)}</span> },
		];
	})();

	return (
		<div className="px-6 py-2 bg-[#ffffff] border-b border-neutral-100">
			<Breadcrumb separator=">" items={items} />
		</div>
	);
}
