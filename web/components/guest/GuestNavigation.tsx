"use client";
import {
	EyeOutlined,
	InfoCircleOutlined,
	LoginOutlined,
	SearchOutlined,
	UserAddOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Dropdown, Space, Tooltip } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";

interface GuestNavigationProps {
	onLoginClick?: () => void;
	onRegisterClick?: () => void;
	onUpgradePrompt?: () => void;
}

export default function GuestNavigation({
	onLoginClick,
	onRegisterClick,
	onUpgradePrompt,
}: GuestNavigationProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { isGuest } = useAuth();
	const { session, getRemainingCount } = useGuestSession();

	// 如果不是游客模式，不显示游客导航
	if (!isGuest || !session) {
		return null;
	}

	const remainingSearches = getRemainingCount("search");
	const remainingViews = getRemainingCount("view");

	const handleLoginClick = () => {
		if (onLoginClick) {
			onLoginClick();
		} else {
			router.push("/login");
		}
	};

	const handleRegisterClick = () => {
		if (onRegisterClick) {
			onRegisterClick();
		} else {
			router.push("/register");
		}
	};

	const handleUpgradeClick = () => {
		if (onUpgradePrompt) {
			onUpgradePrompt();
		} else {
			router.push("/register");
		}
	};

	// 导航链接样式
	const getLinkClass = (path: string) => {
		const isActive = pathname === path || pathname.startsWith(path);
		return `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
			isActive
				? "bg-blue-100 text-blue-700"
				: "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
		}`;
	};

	// 游客状态下拉菜单
	const guestMenuItems = [
		{
			key: "usage",
			label: (
				<div className="px-2 py-1">
					<div className="text-xs text-gray-500 mb-1">今日使用情况</div>
					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="flex items-center gap-1">
								<SearchOutlined />
								搜索
							</span>
							<span className="font-medium">
								{session.limitations.searchCount}/
								{session.limitations.maxSearchPerDay}
							</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="flex items-center gap-1">
								<EyeOutlined />
								查看
							</span>
							<span className="font-medium">
								{session.limitations.viewCount}/
								{session.limitations.maxViewPerDay}
							</span>
						</div>
					</div>
				</div>
			),
			disabled: true,
		},
		{
			type: "divider" as const,
		},
		{
			key: "upgrade",
			label: (
				<div className="flex items-center gap-2 text-blue-600">
					<UserAddOutlined />
					<span>注册解锁全部功能</span>
				</div>
			),
			onClick: handleUpgradeClick,
		},
	];

	return (
		<header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* 品牌标识 */}
					<div className="flex items-center gap-3">
						<Link href="/" className="flex items-center gap-2">
							<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
								<span className="text-white text-sm font-bold">B</span>
							</div>
							<span className="text-xl font-semibold text-gray-900">
								BlacklistHub
							</span>
						</Link>

						{/* 游客标识 */}
						<Badge dot={true} color="orange" title="游客模式">
							<div className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
								游客模式
							</div>
						</Badge>
					</div>

					{/* 导航菜单 */}
					<nav className="hidden md:flex items-center gap-1">
						<Link href="/" className={getLinkClass("/")}>
							首页
						</Link>
						<Link
							href="/blacklist/public"
							className={getLinkClass("/blacklist/public")}
						>
							黑名单
						</Link>
						<Link href="/help" className={getLinkClass("/help")}>
							帮助
						</Link>
					</nav>

					{/* 使用统计和操作区域 */}
					<div className="flex items-center gap-3">
						{/* 使用统计 - 桌面端 */}
						<div className="hidden lg:flex items-center gap-4 text-sm text-gray-600">
							<Tooltip title="今日剩余搜索次数">
								<div className="flex items-center gap-1">
									<SearchOutlined />
									<span
										className={
											remainingSearches <= 2
												? "text-orange-600 font-medium"
												: ""
										}
									>
										{remainingSearches}
									</span>
								</div>
							</Tooltip>
							<Tooltip title="今日剩余查看次数">
								<div className="flex items-center gap-1">
									<EyeOutlined />
									<span
										className={
											remainingViews <= 10 ? "text-orange-600 font-medium" : ""
										}
									>
										{remainingViews}
									</span>
								</div>
							</Tooltip>
						</div>

						{/* 游客头像和菜单 */}
						<Dropdown
							menu={{ items: guestMenuItems }}
							placement="bottomRight"
							trigger={["click"]}
						>
							<div className="flex items-center gap-2 cursor-pointer select-none hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
								<Avatar
									size="small"
									icon={<UserOutlined />}
									className="bg-orange-500"
								/>
								<span className="hidden sm:block text-sm text-gray-700">
									游客
								</span>
							</div>
						</Dropdown>

						{/* 登录注册按钮 */}
						<div className="flex items-center gap-2">
							<Button
								size="small"
								icon={<LoginOutlined />}
								onClick={handleLoginClick}
								className="hidden sm:flex"
							>
								登录
							</Button>
							<Button
								type="primary"
								size="small"
								icon={<UserAddOutlined />}
								onClick={handleRegisterClick}
								className="bg-gradient-to-r from-blue-500 to-purple-600 border-none"
							>
								注册
							</Button>
						</div>
					</div>
				</div>

				{/* 移动端导航菜单 */}
				<div className="md:hidden border-t border-gray-100 py-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Link href="/" className={getLinkClass("/")}>
								首页
							</Link>
							<Link
								href="/blacklist/public"
								className={getLinkClass("/blacklist/public")}
							>
								黑名单
							</Link>
							<Link href="/help" className={getLinkClass("/help")}>
								帮助
							</Link>
						</div>

						{/* 移动端使用统计 */}
						<div className="flex items-center gap-3 text-xs text-gray-600">
							<div className="flex items-center gap-1">
								<SearchOutlined />
								<span>{remainingSearches}</span>
							</div>
							<div className="flex items-center gap-1">
								<EyeOutlined />
								<span>{remainingViews}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 功能限制警告条 */}
			{(remainingSearches <= 2 || remainingViews <= 10) && (
				<div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-sm text-orange-700">
								<InfoCircleOutlined />
								<span>
									{remainingSearches <= 2 &&
										`搜索次数即将用完（剩余${remainingSearches}次）`}
									{remainingSearches <= 2 && remainingViews <= 10 && "，"}
									{remainingViews <= 10 &&
										`查看次数不多了（剩余${remainingViews}次）`}
								</span>
							</div>
							<Button
								type="link"
								size="small"
								className="text-orange-700 hover:text-orange-800"
								onClick={handleUpgradeClick}
							>
								立即注册解锁
							</Button>
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
