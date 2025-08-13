"use client";
import { Tag, Empty } from "antd";

export default function Timeline({ items }: { items?: { action: string; by: string; at: string; note?: string }[] }) {
  if (!items || items.length === 0) return <Empty description="暂无时间线" />;
  return (
    <div className="space-y-2">
      {items.map((t, idx) => (
        <div key={idx} className="text-sm text-neutral-700">
          <span className="font-mono">{new Date(t.at).toLocaleString()}</span>
          <span className="mx-2">{t.by}</span>
          <Tag>{t.action}</Tag>
          {t.note && <span className="ml-2">{t.note}</span>}
        </div>
      ))}
    </div>
  );
}

