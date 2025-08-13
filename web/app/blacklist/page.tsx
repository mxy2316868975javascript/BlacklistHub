"use client";
import { Button, Card, Form, Input, message, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import React from "react";
import useSWR from "swr";
import {
	getReasonCodeLabel,
	getRegionLabel,
	type ReasonCode,
	type Region,
} from "@/types/blacklist";

type BlackItem = {
	_id: string;
	type: "user" | "ip" | "email";
	value: string;
	reason: string;
	reason_code: ReasonCode;
	risk_level: "low" | "medium" | "high";
	source?:
		| "user_report"
		| "system_detection"
		| "manual_review"
		| "external_data"
		| "partner"
		| "regulatory"
		| "other";
	region?: Region;
	sources?: string[];
	status: "draft" | "pending" | "published" | "rejected" | "retracted";
	operator: string;
	created_at: string;
	updated_at: string;
	expires_at?: string;
};

type Query = {
	keyword?: string;
	type?: BlackItem["type"];
	risk_level?: BlackItem["risk_level"];
	start?: string;
	end?: string;
	page?: number;
	pageSize?: number;
};

const fetcher = (url: string, params?: Query) =>
	axios
		.get(url, { params })
		.then((r) => r.data as { items: BlackItem[]; total: number });

export default function BlacklistPage() {
	const [query, setQuery] = React.useState<Query>({
		keyword: "",
		type: undefined,
		risk_level: undefined,
		page: 1,
		pageSize: 10,
	});
	const [role, setRole] = React.useState<"reporter" | "reviewer" | "admin">(
		"reporter",
	);
	const { data, mutate, isLoading } = useSWR(
		["/api/blacklist", query],
		([url, p]) => fetcher(url, p),
	);
	React.useEffect(() => {
		(async () => {
			try {
				const res = await axios.get("/api/me");
				setRole(res.data?.user?.role || "reporter");
			} catch {
				setRole("reporter");
			}
		})();
	}, []);

	const columns: ColumnsType<BlackItem> = [
		{ title: "类型", width: 100, dataIndex: "type", key: "type" },
		{ title: "值", dataIndex: "value", key: "value" },
		{
			title: "风险等级",
			width: 100,
			dataIndex: "risk_level",
			key: "risk_level",
		},
		{
			title: "理由码",
			width: 180,
			dataIndex: "reason_code",
			key: "reason_code",
			render: (reasonCode: ReasonCode) => (
				<span title={reasonCode}>{getReasonCodeLabel(reasonCode)}</span>
			),
		},
		{ title: "原因", dataIndex: "reason", key: "reason" },
		{ title: "状态", width: 100, dataIndex: "status", key: "status" },
		{
			title: "来源数",
			width: 100,
			dataIndex: "sources",
			key: "sources",
			render: (s?: string[]) => s?.length ?? 0,
		},
		{
			title: "地区",
			width: 120,
			dataIndex: "region",
			key: "region",
			render: (region: Region) => (
				<span title={region}>{getRegionLabel(region)}</span>
			),
		},
		{
			title: "操作人",
			width: 140,
			align: "center" as const,
			dataIndex: "operator",
			key: "operator",
		},
		{
			title: "最近更新",
			width: 180,
			align: "center" as const,
			dataIndex: "updated_at",
			key: "updated_at",
			render: (t: string) => new Date(t).toLocaleString(),
		},
		{
			title: "操作",
			key: "actions",
			width: 240,
			align: "center" as const,
			fixed: "right" as const,
			render: (_: unknown, record: BlackItem) => (
				<Space>
					<Button
						type="link"
						onClick={() => {
							window.location.href = `/blacklist/${record._id}`;
						}}
					>
						详情
					</Button>
					<Button
						type="link"
						onClick={async () => {
							await axios.put(`/api/blacklist/${record._id}`, {
								status: "pending",
							});
							message.success("已提交复核");
							mutate();
						}}
						disabled={record.status !== "draft"}
					>
						提交复核
					</Button>
					<Button
						type="link"
						onClick={async () => {
							await axios.put(`/api/blacklist/${record._id}`, {
								status: "published",
							});
							message.success("已发布");
							mutate();
						}}
						disabled={
							record.status !== "pending" ||
							!(role === "reviewer" || role === "admin")
						}
					>
						发布
					</Button>
					<Button
						type="link"
						onClick={async () => {
							await axios.put(`/api/blacklist/${record._id}`, {
								status: "rejected",
							});
							message.success("已退回");
							mutate();
						}}
						disabled={
							record.status !== "pending" ||
							!(role === "reviewer" || role === "admin")
						}
					>
						退回
					</Button>
					<Button
						type="link"
						danger
						onClick={async () => {
							await axios.put(`/api/blacklist/${record._id}`, {
								status: "retracted",
							});
							message.success("已撤销");
							mutate();
						}}
						disabled={
							record.status !== "published" ||
							!(role === "reviewer" || role === "admin")
						}
					>
						撤销
					</Button>
					<Button
						type="link"
						danger
						onClick={async () => {
							await axios.delete(`/api/blacklist/${record._id}`);
							message.success("已删除");
							mutate();
						}}
						disabled={!(role === "admin")}
					>
						删除
					</Button>
				</Space>
			),
		},
	];

	return (
		<div className="p-6 space-y-4">
			<Card className="!mb-4">
				<Form
					layout="inline"
					onFinish={(v) =>
						setQuery({
							keyword: v.keyword ?? "",
							type: v.type,
							risk_level: v.risk_level,
							start: v.start,
							end: v.end,
						})
					}
				>
					<Form.Item name="type" label="类型">
						<div className="w-[200px]">
							<Select
								className="w-full"
								allowClear
								options={[
									{ label: "用户", value: "user" },
									{ label: "IP", value: "ip" },
									{ label: "邮箱", value: "email" },
								]}
							/>
						</div>
					</Form.Item>
					<Form.Item name="risk_level" label="风险">
						<div className="w-[160px]">
							<Select
								allowClear
								options={[
									{ label: "低", value: "low" },
									{ label: "中", value: "medium" },
									{ label: "高", value: "high" },
								]}
							/>
						</div>
					</Form.Item>
					<Form.Item name="keyword" label="关键词">
						<Input placeholder="值/原因/理由码/来源" allowClear />
					</Form.Item>
					<Form.Item name="start" label="开始">
						<Input type="date" />
					</Form.Item>
					<Form.Item name="end" label="结束">
						<Input type="date" />
					</Form.Item>
					<Form.Item>
						<Space>
							<Button type="primary" htmlType="submit">
								查询
							</Button>
							<Button
								onClick={() => {
									window.location.href = "/blacklist/new";
								}}
							>
								新建
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Card>

			<Card>
				<Table
					rowKey="_id"
					loading={isLoading}
					columns={columns}
					dataSource={data?.items ?? []}
					scroll={{ x: "max-content" }}
					pagination={{
						total: data?.total ?? 0,
						current: query.page,
						pageSize: query.pageSize,
						showSizeChanger: true,
					}}
					onChange={(p) =>
						setQuery((q) => ({
							...q,
							page: p.current ?? 1,
							pageSize: p.pageSize ?? 10,
						}))
					}
				/>
			</Card>
		</div>
	);
}
