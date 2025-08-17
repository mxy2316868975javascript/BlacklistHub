"use client";
import {
	EyeOutlined,
	LoginOutlined,
	MenuOutlined,
	MoreOutlined,
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
import MobileMenu from "./MobileMenu";

export default function CompactNav() {
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
		`inline-flex items-center h-10 px-2 text-sm font-medium no-underline border-b-2 transition-colors whitespace-nowrap ${
			current === key
				? "!text-neutral-900 border-blue-600"
				: "!text-neutral-600 hover:!text-neutral-900 border-transparent hover:border-gray-200"
		}`;

	const logout = async () => {
		try {
			await authLogout();
			message.success("已退出");
		} catch {
			message.error("退出登录失败");
		}
	};

	// 核心菜单项（始终显示）
	const coreMenuItems = [
		{ key: "search", href: "/search", label: "查询" },
		{ key: "blacklist-public", href: "/blacklist/public", label: "名单" },
		{ key: "help", href: "/help", label: "帮助" },
	];

	// 用户菜单项（下拉菜单中显示）
	const userMenuItems = user ? [
		{ key: "dashboard", href: "/dashboard", label: "仪表盘" },
		{ key: "blacklist", href: "/blacklist", label: "管理失信" },
		{ key: "new", href: "/blacklist/new", label: "举报失信" },
		{ key: "defaulters", href: "/defaulters", label: "失信统计" },
		{ key: "contributors", href: "/contributors", label: "贡献者" },
		{ key: "rankings", href: "/rankings", label: "排名" },
	] : [];

	// 管理员菜单项
	const adminMenuItems = (user?.role && PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(user.role as UserRole)) ? [
		{ key: "users", href: "/users", label: "用户管理" },
		{ key: "admin-users", href: "/admin/users", label: "角色管理" },
	] : [];

	// 构建更多菜单的下拉项
	const moreMenuItems = [
		...userMenuItems.map(item => ({
			key: item.key,
			label: <Link href={item.href}>{item.label}</Link>,
		})),
		...(adminMenuItems.length > 0 ? [
			{ type: "divider" as const },
			...adminMenuItems.map(item => ({
				key: item.key,
				label: <Link href={item.href}>{item.label}</Link>,
			}))
		] : [])
	];

	return (
		<>
			<header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-100">
				<div className="px-4 sm:px-6 mx-auto h-14 flex items-center justify-between">
					{/* 左侧：移动菜单 + 品牌 */}
					<div className="flex items-center gap-3">
						<MobileMenu
							onRegister={() => setShowRegistrationGuide(true)}
							onLogin={() => window.location.href = "/login"}
							onLogout={logout}
						/>
						
						<Link href="/" className="flex items-center gap-2">
							<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-semibold">
								B
							</span>
							<span className="text-neutral-900 font-semibold tracking-tight hidden sm:block">
								Blacklist Hub
							</span>
						</Link>
						
						{isGuest && (
							<Tag color="orange" className="text-xs hidden sm:inline-block">
								游客
							</Tag>
						)}
					</div>

					{/* 中间：桌面端导航 */}
					<nav className="hidden md:flex items-center gap-1">
						{/* 核心功能 */}
						{coreMenuItems.map(item => (
							<Link
								key={item.key}
								href={item.href}
								className={linkCls(item.key)}
								prefetch={false}
							>
								{item.label}
							</Link>
						))}

						{/* 更多菜单 */}
						{user && moreMenuItems.length > 0 && (
							<Dropdown
								menu={{ items: moreMenuItems }}
								placement="bottomRight"
								trigger={['click']}
							>
								<button
									type="button"
									className={linkCls("more")}
								>
									<MoreOutlined />
									<span className="ml-1">更多</span>
								</button>
							</Dropdown>
						)}
					</nav>

					{/* 右侧：用户信息 */}
					<div className="flex items-center gap-2">
						{/* 游客状态 */}
						{isGuest && session && (
							<div className="hidden lg:flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded">
								<SearchOutlined className="text-blue-500" />
								<span className="text-gray-600">
									{getRemainingCount("search")}/{session.limitations.maxSearchPerDay}
								</span>
							</div>
						)}

						{/* 用户菜单 */}
						<div className="hidden md:block">
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
															className="border-none bg-transparent p-0 cursor-pointer text-inherit font-inherit w-full text-left"
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
														window.location.href = "/login";
													},
												},
											],
								}}
							>
								<div className="flex items-center gap-2 cursor-pointer select-none">
									<Avatar size="small">
										{user?.username?.[0]?.toUpperCase() || "G"}
									</Avatar>
									<span className="text-neutral-700 hidden lg:block">
										{user?.username || "游客"}
									</span>
								</div>
							</Dropdown>
						</div>
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
