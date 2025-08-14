"use client";
import {
	EyeOutlined,
	LoginOutlined,
	SearchOutlined,
	UserAddOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, message, Tag } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";
import type { UserRole } from "@/types/user";
import { PERMISSIONS } from "@/types/user";
import { RegistrationGuide } from "./guest/RegistrationGuide";

export default function NavClient() {
	const pathname = usePathname();
	const { user, isGuest, logout: authLogout } = useAuth();
	const { session, getRemainingCount } = useGuestSession();
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);

	const current = useMemo(() => {
		if (pathname?.startsWith("/dashboard")) return "dashboard";
		if (pathname?.startsWith("/blacklist/public")) return "blacklist-public";
		if (pathname?.startsWith("/blacklist")) return "blacklist";
		if (pathname?.startsWith("/defaulters")) return "defaulters";
		if (pathname?.startsWith("/contributors")) return "contributors";
		if (pathname?.startsWith("/rankings")) return "rankings";
		if (pathname?.startsWith("/search")) return "search";
		if (pathname?.startsWith("/help")) return "help";
		if (pathname?.startsWith("/users")) return "users";
		if (pathname?.startsWith("/admin/users")) return "admin-users";
		return "";
	}, [pathname]);

	const linkCls = (key: string) =>
		`inline-flex items-center h-10 px-3 text-sm font-medium no-underline border-b-2 ${
			current === key
				? "!text-neutral-900 border-blue-600"
				: "!text-neutral-600 hover:!text-neutral-900 border-transparent"
		}`;

	const logout = async () => {
		try {
			await authLogout();
			message.success("已退出");
		} catch {
			message.error("退出登录失败");
		}
	};

	return (
		<>
			<header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-100">
				<div className="px-6 mx-auto h-14 flex items-center justify-between">
					{/* Brand */}
					<div className="flex items-center gap-3">
						<Link href="/" className="flex items-center gap-2">
							<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-semibold">
								B
							</span>
							<span className="text-neutral-900 font-semibold tracking-tight">
								Blacklist Hub
							</span>
						</Link>
						{/* 游客标签 */}
						{isGuest && (
							<div className="relative">
								<Tag color="orange" className="text-xs">
									游客模式
								</Tag>
								<div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
							</div>
						)}
					</div>

					{/* Center Nav - Underline style */}
					<nav className="hidden md:flex items-center gap-4">
						{/* 游客和登录用户都可以访问的页面 */}
						<Link href="/search" className={linkCls("search")} prefetch={false}>
							失信查询
						</Link>
						<Link
							href="/blacklist/public"
							className={linkCls("blacklist-public")}
							prefetch={false}
						>
							失信名单
						</Link>
						<Link href="/help" className={linkCls("help")} prefetch={false}>
							帮助中心
						</Link>

						{/* 仅登录用户可访问的页面 */}
						{user && (
							<>
								<Link
									href="/dashboard"
									className={linkCls("dashboard")}
									prefetch={false}
								>
									仪表盘
								</Link>
								<Link
									href="/blacklist"
									className={linkCls("blacklist")}
									prefetch={false}
								>
									管理失信
								</Link>
								<Link
									href="/defaulters"
									className={linkCls("defaulters")}
									prefetch={false}
								>
									失信统计
								</Link>
								<Link
									href="/contributors"
									className={linkCls("contributors")}
									prefetch={false}
								>
									贡献者
								</Link>
								<Link
									href="/rankings"
									className={linkCls("rankings")}
									prefetch={false}
								>
									排名
								</Link>
								<Link
									href="/blacklist/new"
									className={linkCls("new")}
									prefetch={false}
								>
									举报失信
								</Link>
							</>
						)}

						{/* 管理员功能 */}
						{user?.role &&
							PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(user.role as UserRole) && (
								<>
									<Link
										href="/users"
										className={linkCls("users")}
										prefetch={false}
									>
										用户管理
									</Link>
									<Link
										href="/admin/users"
										className={linkCls("admin-users")}
										prefetch={false}
									>
										角色管理
									</Link>
								</>
							)}
					</nav>

					{/* Actions */}
					<div className="flex items-center gap-3">
						{/* 游客状态显示 */}
						{isGuest && session && (
							<div className="hidden lg:flex items-center gap-3 text-sm">
								<div className="flex items-center gap-2">
									<SearchOutlined className="text-blue-500" />
									<span className="text-gray-600">
										{getRemainingCount("search")}/
										{session.limitations.maxSearchPerDay}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<EyeOutlined className="text-green-500" />
									<span className="text-gray-600">
										{getRemainingCount("view")}/
										{session.limitations.maxViewPerDay}
									</span>
								</div>
							</div>
						)}

						{/* 用户菜单 */}
						<Dropdown
							menu={{
								items: user
									? [
											{
												key: "profile",
												label: <Link href="/dashboard">个人中心</Link>,
											},
											{ type: "divider" as const },
											{
												key: "logout",
												label: (
													<button
														type="button"
														onClick={logout}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																logout();
															}
														}}
														className="border-none bg-transparent p-0 cursor-pointer text-inherit font-inherit"
													>
														退出登录
													</button>
												),
											},
										]
									: [
											{
												key: "register",
												label: (
													<div className="flex items-center gap-2 text-blue-600">
														<UserAddOutlined />
														<span>注册账户</span>
													</div>
												),
												onClick: () => setShowRegistrationGuide(true),
											},
											{
												key: "login",
												label: (
													<div className="flex items-center gap-2">
														<LoginOutlined />
														<span>登录</span>
													</div>
												),
												onClick: () => {
													// 这里可以添加登录逻辑或跳转
													window.location.href = "/login";
												},
											},
											{ type: "divider" as const },
											{
												key: "usage",
												label: (
													<div className="px-2 py-1">
														<div className="text-xs text-gray-500 mb-2">
															今日使用情况
														</div>
														<div className="space-y-2">
															<div className="flex items-center justify-between text-xs">
																<span className="flex items-center gap-1">
																	<SearchOutlined />
																	查询
																</span>
																<span className="font-medium">
																	{session ? getRemainingCount("search") : 0}/
																	{session?.limitations.maxSearchPerDay || 10}
																</span>
															</div>
															<div className="flex items-center justify-between text-xs">
																<span className="flex items-center gap-1">
																	<EyeOutlined />
																	查看
																</span>
																<span className="font-medium">
																	{session ? getRemainingCount("view") : 0}/
																	{session?.limitations.maxViewPerDay || 50}
																</span>
															</div>
														</div>
													</div>
												),
												disabled: true,
											},
										],
							}}
						>
							<div className="flex items-center gap-2 cursor-pointer select-none">
								<Avatar size="small">
									{user?.username?.[0]?.toUpperCase() || "G"}
								</Avatar>
								<span className="text-neutral-700">
									{user?.username || "游客"}
								</span>
							</div>
						</Dropdown>
					</div>
				</div>
			</header>
			<RegistrationGuide
				open={showRegistrationGuide}
				trigger="feature"
				onRegister={() => {
					setShowRegistrationGuide(false);
					window.location.href = "/register";
				}}
				onLogin={() => {
					setShowRegistrationGuide(false);
					window.location.href = "/login";
				}}
				onDismiss={() => setShowRegistrationGuide(false)}
			/>
		</>
	);
}
