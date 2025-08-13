"use client";
import { Tag } from "antd";

export default function StatusTag({ status }: { status: "draft" | "pending" | "published" | "rejected" | "retracted" }) {
  const color: Record<string, string> = {
    draft: "default",
    pending: "processing",
    published: "success",
    rejected: "error",
    retracted: "warning",
  };
  return <Tag color={color[status]}>{status}</Tag>;
}

