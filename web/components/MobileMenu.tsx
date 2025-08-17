"use client";
import {
	CloseOutlined,
	DashboardOutlined,
	EyeOutlined,
	FileTextOutlined,
	HomeOutlined,
	LoginOutlined,
	MenuOutlined,
	PlusOutlined,
	SearchOutlined,
	TeamOutlined,
	TrophyOutlined,
	UserAddOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Drawer, Divider, Space, Tag } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";
import type { UserRole } from "@/types/user";
import { PERMISSIONS } from "@/types/user";

interface MobileMenuProps {
	onRegister: () => void;
	onLogin: () => void;
	onLogout: () => void;
}

export default function MobileMenu({ onRegister, onLogin, onLogout }: MobileMenuProps) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const { user, isGuest } = useAuth();
	const { session, getRemainingCount } = useGuestSession();

	const showDrawer = () => setOpen(true);
	const onClose = () => setOpen(false);

	const handleLinkClick = () => {
		setOpen(false);
	};

	const menuItems = [
		// 公共页面
		{
			key: "search",
			icon: <SearchOutlined />,
			label: "失信查询",
			href: "/search",
			public: true,
		},
		{
			key: "blacklist-public",
			icon: <FileTextOutlined />,
			label: "失信名单",
			href: "/blacklist/public",
			public: true,
		},
		{
			key: "help",
			icon: <HomeOutlined />,
			label: "帮助中心",
			href: "/help",
			public: true,
		},
	];

	const userMenuItems = [
		{
			key: "dashboard",
			icon: <DashboardOutlined />,
			label: "仪表盘",
			href: "/dashboard",
		},
		{
			key: "blacklist",
			icon: <FileTextOutlined />,
			label: "管理失信",
			href: "/blacklist",
		},
		{
			key: "new",
			icon: <PlusOutlined />,
			label: "举报失信",
			href: "/blacklist/new",
		},
		{
			key: "defaulters",
			icon: <TeamOutlined />,
			label: "失信统计",
			href: "/defaulters",
		},
		{
			key: "contributors",
			icon: <UserOutlined />,
			label: "贡献者",
			href: "/contributors",
		},
		{
			key: "rankings",
			icon: <TrophyOutlined />,
			label: "排名",
			href: "/rankings",
		},
	];

	const adminMenuItems = [
		{
			key: "users",
			icon: <UserOutlined />,
			label: "用户管理",
			href: "/users",
		},
		{
			key: "admin-users",
			icon: <TeamOutlined />,
			label: "角色管理",
			href: "/admin/users",
		},
	];

	const isActive = (href: string) => {
		if (href === "/blacklist/public") return pathname?.startsWith("/blacklist/public");
		if (href === "/blacklist") return pathname?.startsWith("/blacklist") && !pathname?.startsWith("/blacklist/public");
		return pathname?.startsWith(href);
	};

	return (
		<>
			<button
				type="button"
				onClick={showDrawer}
				className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 relative"
				aria-label="打开菜单"
			>
				<MenuOutlined className="text-lg" />
				{/* 添加一个小的指示器，显示有新功能 */}
				{isGuest && (
					<div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
				)}
			</button>

			<Drawer
				title={
					<div className="flex items-center gap-3">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-semibold">
							B
						</span>
						<span className="text-neutral-900 font-semibold">Blacklist Hub</span>
						{isGuest && (
							<Tag color="orange" size="small">
								游客
							</Tag>
						)}
					</div>
				}
				placement="left"
				onClose={onClose}
				open={open}
				width={300}
				closeIcon={<CloseOutlined />}
				styles={{
					body: { padding: '16px' },
					header: { borderBottom: '1px solid #f0f0f0' }
				}}
				destroyOnClose={false}
			>
				<div className="flex flex-col h-full">
					{/* 用户信息区域 */}
					<div className="mb-6 p-4 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-3 mb-3">
							<Avatar size="large">
								{user?.username?.[0]?.toUpperCase() || "G"}
							</Avatar>
							<div>
								<div className="font-medium text-gray-900">
									{user?.username || "游客用户"}
								</div>
								<div className="text-sm text-gray-500">
									{user?.role === "admin" ? "管理员" : 
									 user?.role === "super_admin" ? "超级管理员" : 
									 user ? "普通用户" : "游客模式"}
								</div>
							</div>
						</div>

						{/* 游客使用情况 */}
						{isGuest && session && (
							<div className="space-y-2">
								<div className="text-xs text-gray-500 mb-2">今日使用情况</div>
								<div className="flex justify-between items-center">
									<span className="flex items-center gap-1 text-sm">
										<SearchOutlined className="text-blue-500" />
										查询次数
									</span>
									<Badge 
										count={`${getRemainingCount("search")}/${session.limitations.maxSearchPerDay}`}
										style={{ backgroundColor: '#52c41a' }}
									/>
								</div>
								<div className="flex justify-between items-center">
									<span className="flex items-center gap-1 text-sm">
										<EyeOutlined className="text-green-500" />
										查看次数
									</span>
									<Badge 
										count={`${getRemainingCount("view")}/${session.limitations.maxViewPerDay}`}
										style={{ backgroundColor: '#1890ff' }}
									/>
								</div>
							</div>
						)}
					</div>

					{/* 菜单项 */}
					<div className="flex-1 space-y-1">
						{/* 公共功能 */}
						<div className="mb-4">
							<div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
								公共功能
							</div>
							{menuItems.map((item) => (
								<Link
									key={item.key}
									href={item.href}
									onClick={handleLinkClick}
									className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
										isActive(item.href)
											? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
											: "text-gray-700 hover:bg-gray-50"
									}`}
								>
									{item.icon}
									<span>{item.label}</span>
								</Link>
							))}
						</div>

						{/* 用户功能 */}
						{user && (
							<div className="mb-4">
								<div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
									用户功能
								</div>
								{userMenuItems.map((item) => (
									<Link
										key={item.key}
										href={item.href}
										onClick={handleLinkClick}
										className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
											isActive(item.href)
												? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
												: "text-gray-700 hover:bg-gray-50"
										}`}
									>
										{item.icon}
										<span>{item.label}</span>
									</Link>
								))}
							</div>
						)}

						{/* 管理功能 */}
						{user?.role && PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(user.role as UserRole) && (
							<div className="mb-4">
								<div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
									管理功能
								</div>
								{adminMenuItems.map((item) => (
									<Link
										key={item.key}
										href={item.href}
										onClick={handleLinkClick}
										className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
											isActive(item.href)
												? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
												: "text-gray-700 hover:bg-gray-50"
										}`}
									>
										{item.icon}
										<span>{item.label}</span>
									</Link>
								))}
							</div>
						)}
					</div>

					{/* 底部操作区域 */}
					<div className="border-t pt-4 space-y-2">
						{user ? (
							<>
								<Link
									href="/dashboard"
									onClick={handleLinkClick}
									className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
								>
									<UserOutlined />
									<span>个人中心</span>
								</Link>
								<button
									type="button"
									onClick={() => {
										onLogout();
										handleLinkClick();
									}}
									className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								>
									<LoginOutlined />
									<span>退出登录</span>
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={() => {
										onRegister();
										handleLinkClick();
									}}
									className="w-full flex items-center gap-3 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								>
									<UserAddOutlined />
									<span>注册账户</span>
								</button>
								<button
									type="button"
									onClick={() => {
										onLogin();
										handleLinkClick();
									}}
									className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
								>
									<LoginOutlined />
									<span>登录</span>
								</button>
							</>
						)}
					</div>
				</div>
			</Drawer>
		</>
	);
}
