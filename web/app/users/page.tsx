"use client";
import { Card, Dropdown, Input, Select, Space, Table, Tag } from "antd";
import axios from "axios";
import React from "react";
import useSWR from "swr";

const fetcher = (url: string, params?: any) =>
	axios.get(url, { params }).then((r) => r.data);

export default function UsersPage() {
	const [query, setQuery] = React.useState<{
		keyword?: string;
		role?: string;
		page: number;
		pageSize: number;
	}>({ page: 1, pageSize: 10 });
	const { data, isLoading, mutate } = useSWR(
		["/api/users", query],
		([url, p]) => fetcher(url, p),
	);

	return (
		<div className="p-6 space-y-4">
			<Card>
				<Space wrap>
					<Input
						allowClear
						style={{ width: 220 }}
						placeholder="搜索用户名"
						onChange={(e) =>
							setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))
						}
					/>
					<Select
						allowClear
						placeholder="角色"
						style={{ width: 160 }}
						onChange={(v) => setQuery((q) => ({ ...q, role: v, page: 1 }))}
						options={[
							{ label: "Reporter", value: "reporter" },
							{ label: "Reviewer", value: "reviewer" },
							{ label: "Admin", value: "admin" },
						]}
					/>
				</Space>
			</Card>

			<Card>
				<Table
					rowKey="_id"
					loading={isLoading}
					dataSource={data?.items || []}
					columns={[
						{ title: "用户名", dataIndex: "username" },
						{
							title: "角色",
							dataIndex: "role",
							render: (_: any, record: any) => (
								<Dropdown
									menu={{
										items: [
											{ key: "reporter", label: "Reporter" },
											{ key: "reviewer", label: "Reviewer" },
											{ key: "admin", label: "Admin" },
										],
										onClick: async ({ key }) => {
											await axios.put(`/api/users/${record._id}`, {
												role: key,
											});
											mutate();
										},
									}}
								>
									<Tag
										color={
											record.role === "admin"
												? "red"
												: record.role === "reviewer"
													? "blue"
													: "default"
										}
										className="cursor-pointer"
									>
										{record.role}
									</Tag>
								</Dropdown>
							),
						},
						{ title: "总录入", dataIndex: ["stats", "total"], width: 120 },
						{ title: "已发布", dataIndex: ["stats", "published"], width: 120 },
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
