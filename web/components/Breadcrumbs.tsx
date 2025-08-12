"use client";
import { Breadcrumb } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  dashboard: "仪表盘",
  blacklist: "黑名单",
};

export default function Breadcrumbs() {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);
  const items = parts.map((part, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/");
    return { title: <Link href={href}>{labelMap[part] || part}</Link> };
  });

  if (items.length === 0) return null;

  return (
    <div className="px-6 py-3 bg-white">
      <Breadcrumb items={items} />
    </div>
  );
}

