"use client";
import { Card, message, Select, Table } from "antd";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import type { User, UserInfo } from "@/types/user";
import { PERMISSIONS, USER_ROLE_OPTIONS } from "@/types/user";

const usersFetcher = (url: string) =>
	axios.get(url).then((r) => r.data as { items: User[] });

const userInfoFetcher = (url: string) =>
	axios.get(url).then((r) => r.data as { user: UserInfo });

export default function AdminUsersPage() {
	const router = useRouter();
	const { data, mutate, isLoading } = useSWR("/api/users", usersFetcher);
	const { data: currentUser } = useSWR("/api/userinfo", userInfoFetcher);

	const currentUserRole = currentUser?.user?.role;
	const currentUserId = currentUser?.user?.uid;

	// 权限检查
	useEffect(() => {
		if (
			currentUser &&
			currentUserRole &&
			!PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(currentUserRole)
		) {
			router.push("/");
		}
	}, [currentUser, currentUserRole, router]);

	// 如果没有权限，不渲染内容
	if (
		currentUser &&
		currentUserRole &&
		!PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(currentUserRole)
	) {
		return null;
	}

	return (
		<div className="p-6">
			<Card title="角色管理">
				<Table<User>
					rowKey="_id"
					loading={isLoading}
					dataSource={data?.items || []}
					columns={[
						{ title: "用户名", dataIndex: "username" },
						{
							title: "角色",
							dataIndex: "role",
							render: (role: User["role"], record) => {
								// 检查是否可以修改该用户的角色
								const canChangeRole = currentUserRole
									? PERMISSIONS.CAN_CHANGE_USER_ROLE_BY_ROLE(
											currentUserRole,
											record.role,
										)
									: false;

								return (
									<Select
										value={role}
										style={{ width: 160 }}
										options={USER_ROLE_OPTIONS}
										disabled={!canChangeRole || record._id === currentUserId}
										onChange={async (v) => {
											try {
												await axios.put(`/api/users/${record._id}`, {
													role: v,
												});
												message.success("已更新角色");
												mutate();
											} catch (error: unknown) {
												const errorMessage =
													error instanceof Error ? error.message : "更新失败";
												message.error(errorMessage);
											}
										}}
									/>
								);
							},
						},
					]}
				/>
			</Card>
		</div>
	);
}
