"use client";
import { Spin } from "antd";

import GuestHomePage from "@/components/guest/GuestHomePage";

import { useAuth } from "@/hooks/useAuth";
import Hero from "./Hero";
import QuickLookup from "./QuickLookup";
import RankingSidebar from "./RankingSidebar";
import ReasonsTicker from "./ReasonsTicker";
import SearchCard from "./SearchCard";

// 模拟公开统计数据
const mockPublicStats = {
	totalBlacklist: 125000,
	publishedCount: 98500,
	monthlyGrowth: 12.5,
	activeContributors: 1250,
};

// 模拟最新公开黑名单
const mockRecentBlacklist = [
	{
		id: "1",
		type: "IP",
		value: "192.168.***.***",
		riskLevel: "high",
		createdAt: new Date().toISOString(),
	},
	{
		id: "2",
		type: "Email",
		value: "spam***@example.com",
		riskLevel: "medium",
		createdAt: new Date().toISOString(),
	},
	{
		id: "3",
		type: "Domain",
		value: "malicious***.com",
		riskLevel: "high",
		createdAt: new Date().toISOString(),
	},
];

export default function HomePublicPage() {
	const { isGuest, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Spin size="large" />
			</div>
		);
	}

	// 游客模式显示游客首页
	if (isGuest) {
		return (
			<GuestHomePage
				publicStats={mockPublicStats}
				recentBlacklist={mockRecentBlacklist}
			/>
		);
	}

	// 已登录用户显示原有首页
	return (
		<main className="mx-auto p-6">
			<Hero />

			{/* 主体两栏布局 */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* 左侧 3/4 区域：查询+列表 */}
				<div className="lg:col-span-3 space-y-6">
					<QuickLookup />
					<SearchCard />
				</div>

				{/* 右侧 1/4 区域：榜单/统计 */}
				<div className="lg:col-span-1 space-y-6">
					<RankingSidebar />
					<div>
						<h3 className="text-sm text-neutral-500 mb-2">热门理由码</h3>
						<ReasonsTicker />
					</div>
				</div>
			</div>
		</main>
	);
}
