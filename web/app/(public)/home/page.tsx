import Hero from "./Hero";
import QuickLookup from "./QuickLookup";
import RankingSidebar from "./RankingSidebar";
import ReasonsTicker from "./ReasonsTicker";
import SearchCard from "./SearchCard";

export default function HomePublicPage() {
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
