"use client";
import { Card, Input, Space, Table, Tag } from "antd";
import axios from "axios";
import React from "react";
import useSwr from "swr";

interface Contributor {
	username: string;
	role: string;
	total: number;
	published: number;
}

interface QueryParams {
	keyword?: string;
	page: number;
	pageSize: number;
}

const fetcher = (url: string, params?: QueryParams) =>
	axios.get(url, { params }).then((r) => r.data);

export default function ContributorsPage() {
	const [query, setQuery] = React.useState<{
		keyword?: string;
		page: number;
		pageSize: number;
	}>({ page: 1, pageSize: 10 });
	const { data, isLoading } = useSwr(["/api/contributors", query], ([url, p]) =>
		fetcher(url, p),
	);

	return (
		<div className="p-6 space-y-4">
			<Card>
				<Space wrap={true}>
					<Input
						allowClear={true}
						style={{ width: 220 }}
						placeholder="搜索贡献者用户名"
						onChange={(e) =>
							setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))
						}
					/>
				</Space>
			</Card>

			<Card>
				<Table
					rowKey={(r: Contributor) => r.username}
					loading={isLoading}
					dataSource={data?.items || []}
					columns={[
						{ title: "用户名", dataIndex: "username" },
						{
							title: "角色",
							dataIndex: "role",
							render: (r: string) => (
								<Tag
									color={
										r === "admin"
											? "red"
											: r === "reviewer"
												? "blue"
												: "default"
									}
								>
									{r}
								</Tag>
							),
						},
						{ title: "总录入", dataIndex: "total", width: 120 },
						{ title: "已发布", dataIndex: "published", width: 120 },
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
