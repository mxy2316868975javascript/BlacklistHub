"use client";
import {
	Button,
	Card,
	Col,
	Descriptions,
	Divider,
	Form,
	Input,
	message,
	Row,
	Select,
	Space,
	Tag,
	Typography,
} from "antd";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";
import {
	type BlacklistItem,
	REASON_CODE_OPTIONS,
	REGION_OPTIONS,
	RISK_LEVEL_OPTIONS,
	SOURCE_OPTIONS,
	TYPE_OPTIONS,
} from "@/types/blacklist";
import ReasonCodeHelp from "./_ReasonCodeHelp";
import StatusActions from "./_StatusActions";

import StatusTag from "./_StatusTag";
import Timeline from "./_Timeline";

// 使用共享的BlacklistItem类型，但添加本页面特有的字段
type BlackItem = BlacklistItem & {
	sources?: string[];
	timeline?: { action: string; by: string; at: string; note?: string }[];
};

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function BlacklistDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { data, mutate } = useSWR(`/api/blacklist/${params.id}`, fetcher);
	React.useEffect(() => {
		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			if (url.searchParams.get("created") === "1") {
				message.success("已创建，您可以继续完善与流转状态");
				url.searchParams.delete("created");
				window.history.replaceState({}, "", url.toString());
			}
		}
	}, []);

	const item: BlackItem | undefined = data;

	const [form] = Form.useForm<Partial<BlackItem>>();
	React.useEffect(() => {
		if (item) {
			// 只设置表单需要的字段，避免包含不必要的数据
			form.setFieldsValue({
				type: item.type,
				value: item.value,
				reason: item.reason,
				reason_code: item.reason_code,
				risk_level: item.risk_level,
				source: item.source,
				region: item.region,
			});
		}
	}, [item, form]);

	const statusColor: Record<BlackItem["status"], string> = {
		draft: "default",
		pending: "processing",
		published: "success",
		rejected: "error",
		retracted: "warning",
	};

	if (!item) return <div className="p-6">加载中...</div>;

	return (
		<div className="p-6 space-y-4">
			<Row gutter={[16, 16]}>
				<Col span={16}>
					<Card>
						<div className="flex items-center justify-between">
							<div>
								<Typography.Title level={4} style={{ margin: 0 }}>
									{item.value}
								</Typography.Title>
								<div className="text-neutral-500 text-sm mt-1">
									<span className="mr-3">类型：{item.type}</span>
									<span className="mr-3">
										风险：
										<Tag
											color={
												item.risk_level === "high"
													? "error"
													: item.risk_level === "medium"
														? "warning"
														: "default"
											}
										>
											{item.risk_level}
										</Tag>
									</span>
									<span>
										状态：
										<StatusTag status={item.status} />
									</span>
								</div>
							</div>
							<Space>
								<Button onClick={() => router.push("/")}>返回列表</Button>
								<Button type="primary" onClick={() => form.submit()}>
									保存
								</Button>
							</Space>
						</div>
						<Divider />
						<Form
							form={form}
							layout="vertical"
							onFinish={async (values) => {
								await axios.put(`/api/blacklist/${item._id}`, {
									...values,
								});
								message.success("已保存");
							}}
						>
							<Row gutter={12}>
								<Col span={12}>
									<Form.Item
										name="type"
										label="类型"
										rules={[{ required: true }]}
									>
										<Select options={TYPE_OPTIONS} />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="value"
										label="值"
										rules={[{ required: true }]}
									>
										<Input />
									</Form.Item>
								</Col>
							</Row>
							<Row gutter={12}>
								<Col span={8}>
									<Form.Item
										name="risk_level"
										label="风险等级"
										rules={[{ required: true }]}
									>
										<Select options={RISK_LEVEL_OPTIONS} />
									</Form.Item>
								</Col>
								<Col span={8}>
									<Form.Item
										name="reason_code"
										label={
											<span>
												理由码 <ReasonCodeHelp />
											</span>
										}
										rules={[{ required: true }]}
									>
										<Select
											placeholder="请选择理由码"
											options={REASON_CODE_OPTIONS}
											showSearch
											filterOption={(input, option) =>
												(option?.label ?? "")
													.toLowerCase()
													.includes(input.toLowerCase())
											}
										/>
									</Form.Item>
								</Col>
								<Col span={8}>
									<Form.Item name="expires_at" label="到期时间">
										<Input type="date" />
									</Form.Item>
								</Col>
							</Row>
							<Form.Item
								name="reason"
								label="原因摘要"
								rules={[{ required: true, min: 5 }]}
							>
								<Input.TextArea rows={4} />
							</Form.Item>
							<Form.Item name="source" label="来源">
								<Select
									placeholder="请选择来源"
									allowClear
									options={SOURCE_OPTIONS}
								/>
							</Form.Item>
							<Form.Item name="region" label="地区">
								<Select
									placeholder="请选择地区"
									allowClear
									options={REGION_OPTIONS}
									showSearch
									filterOption={(input, option) => {
										if (!input) return true;
										const searchText = input.toLowerCase();
										return (option?.label ?? "")
											.toLowerCase()
											.includes(searchText);
									}}
								/>
							</Form.Item>
						</Form>
					</Card>
				</Col>
				<Col span={8}>
					<Card title="状态与操作">
						<StatusActions
							id={item._id}
							status={item.status}
							onChanged={() => mutate()}
						/>
						<Divider />
						<Descriptions size="small" column={1}>
							<Descriptions.Item label="来源数">
								{item.sources?.length ?? 0}
							</Descriptions.Item>
							<Descriptions.Item label="创建时间">
								{new Date(item.created_at).toLocaleString()}
							</Descriptions.Item>
							<Descriptions.Item label="最近更新">
								{new Date(item.updated_at).toLocaleString()}
							</Descriptions.Item>
						</Descriptions>
					</Card>
					<Card title="时间线" className="mt-4">
						<Timeline items={item.timeline} />
					</Card>
				</Col>
			</Row>
		</div>
	);
}
