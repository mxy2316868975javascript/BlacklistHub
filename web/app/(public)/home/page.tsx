"use client";
import { Spin, message } from "antd";
import { useEffect, useState } from "react";

import GuestHomePage from "@/components/guest/GuestHomePage";

import { useAuth } from "@/hooks/useAuth";
import Hero from "./Hero";
import QuickLookup from "./QuickLookup";
import RankingSidebar from "./RankingSidebar";
import ReasonsTicker from "./ReasonsTicker";
import SearchCard from "./SearchCard";

interface PublicStats {
	totalBlacklist: number;
	publishedCount: number;
	monthlyGrowth: number;
	activeContributors: number;
}

interface PublicBlacklistItem {
	id: string;
	type: string;
	value: string;
	riskLevel: string;
	createdAt: string;
}

export default function HomePublicPage() {
	const { isGuest, loading } = useAuth();
	const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
	const [recentBlacklist, setRecentBlacklist] = useState<PublicBlacklistItem[]>([]);
	const [dataLoading, setDataLoading] = useState(false);

	// 获取公开统计数据
	const fetchPublicStats = async () => {
		try {
			const response = await fetch('/api/guest/stats?type=overview');
			if (!response.ok) {
				throw new Error('Failed to fetch stats');
			}
			const data = await response.json();
			setPublicStats({
				totalBlacklist: data.totalBlacklist,
				publishedCount: data.publishedCount,
				monthlyGrowth: data.monthlyGrowth,
				activeContributors: data.activeContributors,
			});
		} catch (error) {
			console.error('Error fetching public stats:', error);
			// 使用默认数据作为后备
			setPublicStats({
				totalBlacklist: 0,
				publishedCount: 0,
				monthlyGrowth: 0,
				activeContributors: 0,
			});
		}
	};

	// 获取最新公开黑名单
	const fetchRecentBlacklist = async () => {
		try {
			const response = await fetch('/api/guest/blacklist/public?page=1&pageSize=6');
			if (!response.ok) {
				throw new Error('Failed to fetch blacklist');
			}
			const data = await response.json();
			setRecentBlacklist(data.data || []);
		} catch (error) {
			console.error('Error fetching recent blacklist:', error);
			setRecentBlacklist([]);
		}
	};

	// 游客模式时获取数据
	useEffect(() => {
		if (isGuest && !loading) {
			setDataLoading(true);
			Promise.all([
				fetchPublicStats(),
				fetchRecentBlacklist(),
			]).finally(() => {
				setDataLoading(false);
			});
		}
	}, [isGuest, loading]);

	if (loading || (isGuest && dataLoading)) {
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
				publicStats={publicStats || {
					totalBlacklist: 0,
					publishedCount: 0,
					monthlyGrowth: 0,
					activeContributors: 0,
				}}
				recentBlacklist={recentBlacklist}
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
