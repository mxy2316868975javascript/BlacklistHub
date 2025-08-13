"use client";
import { Card, Select, Space, Table, Tag } from "antd";
import axios from "axios";
import React from "react";
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function DefaultersPage() {
	const [query, setQuery] = React.useState<{
		type?: string;
		risk_level?: string;
		page: number;
		pageSize: number;
	}>({ page: 1, pageSize: 10 });
	const qs = new URLSearchParams(
		Object.entries(query).reduce(
			(acc, [k, v]) => {
				if (v !== undefined && v !== null) acc[k] = String(v);
				return acc;
			},
			{} as Record<string, string>,
		),
	).toString();
	const { data, isLoading } = useSWR(`/api/defaulters?${qs}`, fetcher);

	return (
		<div className="p-6 space-y-4">
			<Card>
				<Space wrap>
					<Select
						allowClear
						placeholder="类型"
						style={{ width: 160 }}
						onChange={(v) => setQuery((q) => ({ ...q, type: v, page: 1 }))}
						options={[
							{ label: "用户", value: "user" },
							{ label: "IP", value: "ip" },
							{ label: "邮箱", value: "email" },
							{ label: "手机号", value: "phone" },
							{ label: "域名", value: "domain" },
						]}
					/>
					<Select
						allowClear
						placeholder="风险"
						style={{ width: 160 }}
						onChange={(v) =>
							setQuery((q) => ({ ...q, risk_level: v, page: 1 }))
						}
						options={[
							{ label: "低", value: "low" },
							{ label: "中", value: "medium" },
							{ label: "高", value: "high" },
						]}
					/>
				</Space>
			</Card>

			<Card>
				<Table
					rowKey={(r) => `${r._id.type}:${r._id.value}`}
					loading={isLoading}
					dataSource={data?.items || []}
					columns={[
						{ title: "类型", dataIndex: ["_id", "type"] },
						{ title: "值", dataIndex: ["_id", "value"] },
						{ title: "次数", dataIndex: "count", width: 100 },
						{
							title: "最近更新",
							dataIndex: "lastUpdated",
							width: 180,
							render: (t: string) => new Date(t).toLocaleString(),
						},
						{
							title: "风险",
							dataIndex: "risk",
							width: 100,
							render: (r: number) => (
								<Tag
									color={r === 3 ? "error" : r === 2 ? "warning" : "default"}
								>
									{r === 3 ? "high" : r === 2 ? "medium" : "low"}
								</Tag>
							),
						},
					]}
					pagination={{
						current: query.page,
						pageSize: query.pageSize,
						total: data?.total || 0,
						showSizeChanger: true,
					}}
					onChange={(p) =>
						setQuery((q) => ({
							...q,
							page: p.current || 1,
							pageSize: p.pageSize || 10,
						}))
					}
				/>
			</Card>
		</div>
	);
}
