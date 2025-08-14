"use client";
import {
	Button,
	Card,
	Dropdown,
	Input,
	Modal,
	message,
	Select,
	Space,
	Table,
	Tag,
} from "antd";
import axios from "axios";
import React from "react";
import useSwr from "swr";
import type { User } from "@/types/user";
import { PERMISSIONS, USER_ROLE_OPTIONS } from "@/types/user";

const fetcher = (url: string, params?: any) =>
	axios.get(url, { params }).then((r) => r.data);

export default function UsersPage() {
	const [query, setQuery] = React.useState<{
		keyword?: string;
		role?: string;
		page: number;
		pageSize: number;
	}>({ page: 1, pageSize: 10 });
	const { data, isLoading, mutate } = useSwr(
		["/api/users", query],
		([url, p]) => fetcher(url, p),
	);

	// 获取当前用户信息
	const { data: currentUser } = useSwr("/api/userinfo", fetcher);
	const currentUserRole = currentUser?.user?.role;
	const currentUserId = currentUser?.user?.uid;
	const canAccessUserManagement =
		PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(currentUserRole);

	// 批量选择状态
	const [selectedRowKeys, setSelectedRowKeys] = React.useState<string[]>([]);
	const [batchDeleteLoading, setBatchDeleteLoading] = React.useState(false);

	// 删除用户
	const handleDeleteUser = async (userId: string, username: string) => {
		try {
			await axios.delete(`/api/users/${userId}`);
			message.success(`用户 ${username} 删除成功`);
			mutate(); // 刷新列表
		} catch (error: any) {
			message.error(error.response?.data?.message || "删除失败");
		}
	};

	// 确认删除对话框
	const confirmDelete = (userId: string, username: string) => {
		Modal.confirm({
			title: "确认删除用户",
			content: `确定要删除用户 "${username}" 吗？此操作不可撤销。`,
			okText: "确认删除",
			okType: "danger",
			cancelText: "取消",
			onOk: () => handleDeleteUser(userId, username),
		});
	};

	// 批量删除用户
	const handleBatchDelete = async () => {
		setBatchDeleteLoading(true);
		try {
			const response = await axios.post("/api/users/batch-delete", {
				userIds: selectedRowKeys,
			});
			message.success(response.data.message);
			setSelectedRowKeys([]); // 清空选择
			mutate(); // 刷新列表
		} catch (error: any) {
			message.error(error.response?.data?.message || "批量删除失败");
		} finally {
			setBatchDeleteLoading(false);
		}
	};

	// 确认批量删除对话框
	const confirmBatchDelete = () => {
		const selectedUsers = (data?.items || []).filter((user: User) =>
			selectedRowKeys.includes(user._id),
		);
		const usernames = selectedUsers
			.map((user: User) => user.username)
			.join("、");

		Modal.confirm({
			title: "确认批量删除用户",
			content: `确定要删除以下 ${selectedRowKeys.length} 个用户吗？\n${usernames}\n\n此操作不可撤销。`,
			okText: "确认删除",
			okType: "danger",
			cancelText: "取消",
			onOk: handleBatchDelete,
		});
	};

	return (
		<div className="p-6 space-y-4">
			<Card>
				<div className="flex justify-between items-center">
					<Space wrap={true}>
						<Input
							allowClear={true}
							style={{ width: 220 }}
							placeholder="搜索用户名"
							onChange={(e) =>
								setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))
							}
						/>
						<Select
							allowClear={true}
							placeholder="角色"
							style={{ width: 160 }}
							onChange={(v) => setQuery((q) => ({ ...q, role: v, page: 1 }))}
							options={USER_ROLE_OPTIONS}
						/>
					</Space>

					{/* 批量操作按钮 */}
					{canAccessUserManagement && selectedRowKeys.length > 0 && (
						<Space>
							<span className="text-gray-600">
								已选择 {selectedRowKeys.length} 个用户
							</span>
							<Button
								danger={true}
								loading={batchDeleteLoading}
								onClick={confirmBatchDelete}
								icon={
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-label="删除图标"
									>
										<title>删除</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								}
							>
								批量删除
							</Button>
						</Space>
					)}
				</div>
			</Card>

			<Card>
				<Table
					rowKey="_id"
					loading={isLoading}
					dataSource={data?.items || []}
					rowSelection={
						canAccessUserManagement
							? {
									selectedRowKeys,
									onChange: (keys: React.Key[]) => {
										// 过滤掉当前用户，不允许选择自己
										const filteredKeys = keys.filter(
											(key) => key !== currentUserId,
										) as string[];
										setSelectedRowKeys(filteredKeys);
									},
									getCheckboxProps: (record: User) => ({
										disabled: record._id === currentUserId, // 禁用当前用户的选择框
									}),
								}
							: undefined
					}
					columns={[
						{ title: "用户名", dataIndex: "username" },
						{
							title: "角色",
							dataIndex: "role",
							render: (_: any, record: User) => {
								// 检查是否可以修改该用户的角色
								const canChangeRole = PERMISSIONS.CAN_CHANGE_USER_ROLE_BY_ROLE(
									currentUserRole,
									record.role,
								);

								return (
									<Dropdown
										menu={{
											items: USER_ROLE_OPTIONS.map((option) => ({
												key: option.value,
												label: option.label,
											})),
											onClick: async ({ key }) => {
												if (!canChangeRole) {
													message.error("您没有权限修改该用户的角色");
													return;
												}
												try {
													await axios.put(`/api/users/${record._id}`, {
														role: key,
													});
													message.success("角色修改成功");
													mutate();
												} catch (error: any) {
													message.error("角色修改失败");
												}
											},
										}}
										disabled={!canChangeRole}
									>
										<Tag
											color={
												record.role === "super_admin"
													? "purple"
													: record.role === "admin"
														? "red"
														: record.role === "reviewer"
															? "blue"
															: "default"
											}
											className={canChangeRole ? "cursor-pointer" : ""}
										>
											{record.role === "super_admin"
												? "Super Admin"
												: record.role === "admin"
													? "Admin"
													: record.role === "reviewer"
														? "Reviewer"
														: "Reporter"}
										</Tag>
									</Dropdown>
								);
							},
						},
						{ title: "总录入", dataIndex: ["stats", "total"], width: 120 },
						{ title: "已发布", dataIndex: ["stats", "published"], width: 120 },
						{
							title: "操作",
							key: "actions",
							width: 100,
							render: (_: any, record: User) => {
								// 检查是否可以删除该用户
								const canDelete =
									PERMISSIONS.CAN_DELETE_USER_BY_ROLE(
										currentUserRole,
										record.role,
									) && record._id !== currentUserId;

								return canDelete ? (
									<Button
										type="link"
										danger={true}
										size="small"
										onClick={() => confirmDelete(record._id, record.username)}
									>
										删除
									</Button>
								) : null;
							},
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
