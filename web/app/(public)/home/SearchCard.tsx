"use client";
import { Button, Card, DatePicker, Input, message, Select, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import React, { useEffect } from "react";

export default function SearchCard() {
	const [loading, setLoading] = React.useState(false);
	const [result, setResult] = React.useState<{ total?: number; items?: any[] }>(
		{},
	);

	const [form, setForm] = React.useState({
		type: undefined as undefined | "user" | "ip" | "email" | "phone" | "domain",
		risk_level: undefined as undefined | "low" | "medium" | "high",
		status: undefined as
			| undefined
			| "draft"
			| "pending"
			| "published"
			| "rejected"
			| "retracted",
		keyword: "",
		start: undefined as string | undefined,
		end: undefined as string | undefined,
	});
	// 默认展示：已发布
	React.useEffect(() => {
		setForm((f) => ({ ...f, status: "" as any }));
	}, []);

	const [page, setPage] = React.useState(1);

	const load = async (reset = false) => {
		setLoading(true);
		try {
			const res = await axios.get("/api/blacklist", {
				params: { ...form, page: reset ? 1 : page, pageSize: 10 },
			});
			if (reset) {
				setResult(res.data || {});
				setPage(1);
			} else {
				setResult((prev) => ({
					total: res.data?.total || prev.total,
					items: [...(prev.items || []), ...(res.data?.items || [])],
				}));
			}
		} catch (e) {
			message.error("查询失败");
		} finally {
			setLoading(false);
		}
	};

	<Select
		allowClear
		placeholder="默认：已发布"
		value={form.status}
		onChange={(v) => setForm((f) => ({ ...f, status: v }))}
		options={[
			{ label: "全部", value: undefined as any },
			{ label: "草稿", value: "draft" },
			{ label: "待复核", value: "pending" },
			{ label: "已发布", value: "published" },
			{ label: "已退回", value: "rejected" },
			{ label: "已撤销", value: "retracted" },
		]}
	/>;

	useEffect(() => {
		load(true);
	}, []);

	const search = async () => {
		setPage(1);
		await load(true);
	};

	return (
		<div className="space-y-4">
			<Card>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<Select
						allowClear
						placeholder="类型"
						value={form.type}
						onChange={(v) => setForm((f) => ({ ...f, type: v }))}
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
						placeholder="风险等级"
						value={form.risk_level}
						onChange={(v) => setForm((f) => ({ ...f, risk_level: v }))}
						options={[
							{ label: "低", value: "low" },
							{ label: "中", value: "medium" },
							{ label: "高", value: "high" },
						]}
					/>
					<Select
						allowClear
						placeholder="状态"
						value={form.status}
						onChange={(v) => setForm((f) => ({ ...f, status: v }))}
						options={[
							{ label: "草稿", value: "draft" },
							{ label: "待复核", value: "pending" },
							{ label: "已发布", value: "published" },
							{ label: "已退回", value: "rejected" },
							{ label: "已撤销", value: "retracted" },
						]}
					/>
					<Input
						placeholder="关键词（值/原因/理由码/来源/操作人）"
						value={form.keyword}
						onChange={(e) =>
							setForm((f) => ({ ...f, keyword: e.target.value }))
						}
					/>
					<DatePicker
						placeholder="开始时间"
						className="w-full"
						value={form.start ? dayjs(form.start) : undefined}
						onChange={(d) =>
							setForm((f) => ({ ...f, start: d?.format("YYYY-MM-DD") }))
						}
					/>
					<DatePicker
						placeholder="结束时间"
						className="w-full"
						value={form.end ? dayjs(form.end) : undefined}
						onChange={(d) =>
							setForm((f) => ({ ...f, end: d?.format("YYYY-MM-DD") }))
						}
					/>
				</div>
				<div className="mt-3">
					<Button type="primary" onClick={search} loading={loading}>
						搜索
					</Button>
				</div>
			</Card>

			<Card loading={loading}>
				<div className="flex items-center justify-between mb-3">
					<div className="text-sm text-neutral-500">
						共 {result.total || 0} 条结果
					</div>
				</div>
				<div className="divide-y">
					{(result.items || []).map((i) => (
						<div key={i._id} className="py-4">
							<div className="flex items-start gap-3">
								<div className="shrink-0 w-14 h-14 bg-red-50 text-red-500 flex items-center justify-center rounded">
									{i.risk_level === "high"
										? "骗"
										: i.risk_level === "medium"
											? "警"
											: ""}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="text-sm text-blue-600">被曝光人：</span>
										<span className="font-medium truncate">{i.value}</span>
										<Tag
											color={
												i.risk_level === "high"
													? "error"
													: i.risk_level === "medium"
														? "warning"
														: "default"
											}
										>
											{i.risk_level}
										</Tag>
									</div>
									<div className="text-xs text-neutral-500 mt-1 truncate">
										类型：{i.type} · 状态：{i.status} · 理由码：{i.reason_code}{" "}
										· 来源：{i.source || "-"}
									</div>
									{i.reason && (
										<div className="text-sm text-neutral-700 mt-2 line-clamp-2">
											{i.reason}
										</div>
									)}
									<div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
										<span>
											更新时间：{new Date(i.updated_at).toLocaleString()}
										</span>
										<span>操作人：{i.operator}</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
				<div className="mt-4 flex justify-center">
					<Button
						disabled={
							loading || (result.items?.length || 0) >= (result.total || 0)
						}
						onClick={async () => {
							setPage((p) => p + 1);
							await load(false);
						}}
					>
						加载更多
					</Button>
				</div>
			</Card>
		</div>
	);
}
