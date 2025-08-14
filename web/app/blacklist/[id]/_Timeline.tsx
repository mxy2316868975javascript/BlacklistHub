"use client";
import { Empty, Tag } from "antd";

export default function Timeline({
	items,
}: {
	items?: { action: string; by: string; at: string; note?: string }[];
}) {
	if (!items || items.length === 0) return <Empty description="暂无时间线" />;
	return (
		<div className="space-y-2">
			{items.map((t) => (
				<div key={`timeline-${t.at}-${t.by}-${t.action}`} className="space-y-1">
					<span className="font-mono text-xs text-gray-500">
						{new Date(t.at).toLocaleString()}
					</span>
					<div className="text-sm text-neutral-700">
						<span className="mr-2">{t.by}</span>
						<Tag>{t.action}</Tag>
						{t.note && <span>{t.note}</span>}
					</div>
				</div>
			))}
		</div>
	);
}
