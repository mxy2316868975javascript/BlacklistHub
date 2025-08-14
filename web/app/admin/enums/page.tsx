"use client";

import { Button, Card, message, Space, Table, Tabs, Tag } from "antd";
import axios from "axios";
import { useState } from "react";
import { useReasonCodes, useRegions, useSources } from "@/hooks/useEnums";

export default function EnumsManagePage() {
	const { reasonCodes, isLoading: reasonCodesLoading } = useReasonCodes();
	const { sources, isLoading: sourcesLoading } = useSources();
	const { regions, isLoading: regionsLoading } = useRegions();

	const [loading, setLoading] = useState(false);

	const initializeData = async () => {
		try {
			setLoading(true);
			await axios.post("/api/admin/init-enum-data");
			message.success("枚举数据初始化成功！");
			// 刷新数据
			window.location.reload();
		} catch (error) {
			message.error(`枚举数据初始化失败 ${error}`);
		} finally {
			setLoading(false);
		}
	};

	const reasonCodeColumns = [
		{
			title: "代码",
			dataIndex: "code",
			key: "code",
			width: 200,
		},
		{
			title: "名称",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "分类",
			dataIndex: "category",
			key: "category",
			width: 100,
			render: (category: string) => (
				<Tag
					color={
						category === "fraud"
							? "red"
							: category === "abuse"
								? "orange"
								: category === "violation"
									? "volcano"
									: category === "security"
										? "purple"
										: category === "quality"
											? "blue"
											: "default"
					}
				>
					{category}
				</Tag>
			),
		},
		{
			title: "状态",
			dataIndex: "is_active",
			key: "is_active",
			width: 80,
			render: (active: boolean) => (
				<Tag color={active ? "green" : "red"}>{active ? "启用" : "禁用"}</Tag>
			),
		},
		{
			title: "排序",
			dataIndex: "sort_order",
			key: "sort_order",
			width: 80,
		},
	];

	const sourceColumns = [
		{
			title: "代码",
			dataIndex: "code",
			key: "code",
			width: 200,
		},
		{
			title: "名称",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "描述",
			dataIndex: "description",
			key: "description",
		},
		{
			title: "状态",
			dataIndex: "is_active",
			key: "is_active",
			width: 80,
			render: (active: boolean) => (
				<Tag color={active ? "green" : "red"}>{active ? "启用" : "禁用"}</Tag>
			),
		},
		{
			title: "排序",
			dataIndex: "sort_order",
			key: "sort_order",
			width: 80,
		},
	];

	const regionColumns = [
		{
			title: "代码",
			dataIndex: "code",
			key: "code",
			width: 150,
		},
		{
			title: "名称",
			dataIndex: "name",
			key: "name",
			width: 150,
		},
		{
			title: "省份",
			dataIndex: "province",
			key: "province",
			width: 120,
		},
		{
			title: "级别",
			dataIndex: "level",
			key: "level",
			width: 100,
			render: (level: string) => (
				<Tag
					color={
						level === "municipality"
							? "gold"
							: level === "prefecture"
								? "blue"
								: "green"
					}
				>
					{level === "municipality"
						? "直辖市"
						: level === "prefecture"
							? "地级市"
							: "县级市"}
				</Tag>
			),
		},
		{
			title: "状态",
			dataIndex: "is_active",
			key: "is_active",
			width: 80,
			render: (active: boolean) => (
				<Tag color={active ? "green" : "red"}>{active ? "启用" : "禁用"}</Tag>
			),
		},
		{
			title: "排序",
			dataIndex: "sort_order",
			key: "sort_order",
			width: 80,
		},
	];

	const tabItems = [
		{
			key: "reason-codes",
			label: `理由码 (${reasonCodes.length})`,
			children: (
				<Table
					columns={reasonCodeColumns}
					dataSource={reasonCodes}
					rowKey="_id"
					loading={reasonCodesLoading}
					pagination={{ pageSize: 20 }}
					size="small"
				/>
			),
		},
		{
			key: "sources",
			label: `来源 (${sources.length})`,
			children: (
				<Table
					columns={sourceColumns}
					dataSource={sources}
					rowKey="_id"
					loading={sourcesLoading}
					pagination={{ pageSize: 20 }}
					size="small"
				/>
			),
		},
		{
			key: "regions",
			label: `地区 (${regions.length})`,
			children: (
				<Table
					columns={regionColumns}
					dataSource={regions}
					rowKey="_id"
					loading={regionsLoading}
					pagination={{ pageSize: 50 }}
					size="small"
				/>
			),
		},
	];

	return (
		<div className="p-6">
			<Card>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold mb-2">枚举数据管理</h1>
						<p className="text-gray-600">
							管理系统中的理由码、来源、地区等枚举数据
						</p>
					</div>
					<Space>
						<Button type="primary" loading={loading} onClick={initializeData}>
							初始化数据
						</Button>
					</Space>
				</div>

				<Tabs items={tabItems} />
			</Card>
		</div>
	);
}
