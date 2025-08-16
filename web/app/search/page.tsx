"use client";
import {
	ClearOutlined,
	ClockCircleOutlined,
	EyeOutlined,
	HistoryOutlined,
	InfoCircleOutlined,
	RocketOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Divider,
	Empty,
	Input,
	List,
	Space,
	Tag,
	Tooltip,
	Typography,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchLimitationBanner } from "@/components/guest/FeatureLimitation";

import { RegistrationGuide } from "@/components/guest/RegistrationGuide";
import { useAuth } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";

const { Title, Text } = Typography;
const { Search } = Input;

interface SearchResult {
	id: string;
	type: string;
	value: string;
	riskLevel: "low" | "medium" | "high";
	reasonCode: string;
	createdAt: string;
	matchScore: number;
}

export default function SearchPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isGuest } = useAuth();
	const { session, incrementUsage, getRemainingCount, isLimitReached } =
		useGuestSession();

	const [searchValue, setSearchValue] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [searchHistory, setSearchHistory] = useState<string[]>([]);
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);

	const remainingSearches = getRemainingCount("search");
	const remainingViews = getRemainingCount("view");

	// 从URL参数获取初始搜索词
	useEffect(() => {
		const query = searchParams.get("q");
		if (query) {
			setSearchValue(query);
			performSearch(query);
		}

		// 加载搜索历史（仅游客模式下从localStorage）
		if (isGuest) {
			loadSearchHistory();
		}
	}, [searchParams, isGuest]);

	const loadSearchHistory = () => {
		try {
			const history = localStorage.getItem("guest_search_history");
			if (history) {
				setSearchHistory(JSON.parse(history).slice(0, 5)); // 最多显示5条
			}
		} catch (error) {
			console.error("Failed to load search history:", error);
		}
	};

	const saveSearchHistory = (query: string) => {
		if (!isGuest) return;

		try {
			const history = [...new Set([query, ...searchHistory])].slice(0, 10);
			setSearchHistory(history);
			localStorage.setItem("guest_search_history", JSON.stringify(history));
		} catch (error) {
			console.error("Failed to save search history:", error);
		}
	};

	const clearSearchHistory = () => {
		setSearchHistory([]);
		localStorage.removeItem("guest_search_history");
	};

	const performSearch = async (query: string) => {
		if (!query.trim()) return;

		// 检查搜索限制
		if (isLimitReached("search")) {
			setShowRegistrationGuide(true);
			return;
		}

		setLoading(true);
		setHasSearched(true);

		try {
			// 增加搜索次数
			if (!incrementUsage("search")) {
				setShowRegistrationGuide(true);
				return;
			}

			// 保存搜索历史
			saveSearchHistory(query);

			// 调用真实的搜索API
			const response = await fetch(`/api/guest/search?q=${encodeURIComponent(query)}&limit=20`);

			if (!response.ok) {
				throw new Error(`Search failed: ${response.status}`);
			}

			const data = await response.json();
			setResults(data.results || []);
		} catch (error) {
			console.error("Search failed:", error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (value: string) => {
		setSearchValue(value);
		performSearch(value);

		// 更新URL
		const params = new URLSearchParams();
		if (value) params.set("q", value);
		router.push(`/search?${params.toString()}`);
	};

	const handleViewResult = (result: SearchResult) => {
		// 检查查看限制
		if (isLimitReached("view")) {
			setShowRegistrationGuide(true);
			return;
		}

		// 增加查看次数
		if (incrementUsage("view")) {
			// 跳转到详情页面
			router.push(`/blacklist/public/${result.id}`);
		} else {
			setShowRegistrationGuide(true);
		}
	};

	const handleRegister = () => {
		setShowRegistrationGuide(false);
		router.push("/register");
	};

	const handleLogin = () => {
		setShowRegistrationGuide(false);
		router.push("/login");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto p-6">
				{/* 页面标题 */}
				<div className="mb-6">
					<Title level={2} className="!mb-2">
						🔍 失信查询
					</Title>
					<Text className="text-gray-600">
						查询个人、企业失信信息，了解信用状况
					</Text>
				</div>

				{/* 游客限制提示 */}
				{isGuest && session && (
					<div className="mb-6">
						<SearchLimitationBanner
							remaining={remainingSearches}
							total={session.limitations.maxSearchPerDay}
							onUpgrade={() => setShowRegistrationGuide(true)}
							severity={remainingSearches <= 2 ? "warning" : "info"}
						/>
					</div>
				)}

				{/* 搜索框 */}
				<Card className="mb-6">
					<Search
						placeholder="输入要查询的姓名、身份证号、企业名称..."
						size="large"
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						onSearch={handleSearch}
						loading={loading}
						disabled={isLimitReached("search")}
						enterButton={
							<Button
								type="primary"
								icon={<SearchOutlined />}
								disabled={isLimitReached("search")}
								className="bg-gradient-to-r from-blue-500 to-purple-600 border-none"
							>
								{isLimitReached("search") ? "已达限制" : "查询"}
							</Button>
						}
					/>

					{/* 搜索历史 */}
					{isGuest && searchHistory.length > 0 && !hasSearched && (
						<div className="mt-4">
							<div className="flex items-center justify-between mb-2">
								<Text className="text-sm text-gray-500">
									<HistoryOutlined className="mr-1" />
									最近查询
								</Text>
								<Button
									type="text"
									size="small"
									icon={<ClearOutlined />}
									onClick={clearSearchHistory}
									className="text-gray-400 hover:text-gray-600"
								>
									清除
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{searchHistory.map((item, index) => (
									<Tag
										key={index}
										className="cursor-pointer hover:bg-blue-50"
										onClick={() => handleSearch(item)}
									>
										{item}
									</Tag>
								))}
							</div>
						</div>
					)}
				</Card>

				{/* 搜索结果 */}
				{hasSearched && (
					<Card>
						<div className="flex items-center justify-between mb-4">
							<Title level={4} className="!mb-0">
								搜索结果
							</Title>
							{results.length > 0 && (
								<Text className="text-sm text-gray-500">
									找到 {results.length} 条相关记录
								</Text>
							)}
						</div>

						{results.length === 0 ? (
							<Empty
								description="未找到相关记录"
								image={Empty.PRESENTED_IMAGE_SIMPLE}
							>
								<Text className="text-gray-500">
									尝试使用不同的关键词或检查输入格式
								</Text>
							</Empty>
						) : (
							<>
								<List
									dataSource={results}
									renderItem={(item) => (
										<List.Item
											actions={[
												<Button
													key="view"
													type="link"
													icon={<EyeOutlined />}
													onClick={() => handleViewResult(item)}
													disabled={isLimitReached("view")}
												>
													{isLimitReached("view") ? "已达限制" : "查看详情"}
												</Button>,
											]}
										>
											<List.Item.Meta
												title={
													<div className="flex items-center gap-2">
														<Tag
															color={
																item.type === "person"
																	? "blue"
																	: item.type === "company"
																		? "green"
																		: "orange"
															}
														>
															{item.type === "person"
																? "个人"
																: item.type === "company"
																	? "企业"
																	: item.type === "organization"
																		? "组织"
																		: "其他"}
														</Tag>
														<Text code={true} className="text-sm">
															{item.value}
														</Text>
														<Tag
															color={
																item.riskLevel === "high"
																	? "red"
																	: item.riskLevel === "medium"
																		? "orange"
																		: "green"
															}
														>
															{item.riskLevel === "high"
																? "严重失信"
																: item.riskLevel === "medium"
																	? "一般失信"
																	: "轻微失信"}
														</Tag>
													</div>
												}
												description={
													<div className="flex items-center gap-4 text-sm text-gray-500">
														<span>理由码: {item.reasonCode}</span>
														<span>匹配度: {item.matchScore}%</span>
														<span>
															<ClockCircleOutlined className="mr-1" />
															{new Date(item.createdAt).toLocaleDateString()}
														</span>
													</div>
												}
											/>
										</List.Item>
									)}
								/>

								{/* 游客模式结果限制提示 */}
								{isGuest && results.length >= 10 && (
									<>
										<Divider />
										<Alert
											type="info"
											showIcon={true}
											icon={<InfoCircleOutlined />}
											message="游客模式仅显示前10条结果"
											description={
												<div>
													<p>注册后可查看完整搜索结果和更多详细信息</p>
													<Button
														type="primary"
														size="small"
														icon={<RocketOutlined />}
														onClick={() => setShowRegistrationGuide(true)}
														className="mt-2"
													>
														立即注册查看更多
													</Button>
												</div>
											}
										/>
									</>
								)}
							</>
						)}
					</Card>
				)}

				{/* 游客模式使用提示 */}
				{isGuest && !hasSearched && (
					<Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
						<div className="text-center py-6">
							<div className="text-4xl mb-4">🔍</div>
							<Title level={4} className="!mb-2">
								开始您的失信查询
							</Title>
							<Text className="text-gray-600 mb-4 block">
								在上方搜索框中输入要查询的信息，我们将为您提供失信记录查询
							</Text>
							<Space>
								<Tag>个人姓名</Tag>
								<Tag>身份证号</Tag>
								<Tag>企业名称</Tag>
								<Tag>统一社会信用代码</Tag>
							</Space>
						</div>
					</Card>
				)}
			</div>

			{/* 注册引导模态框 */}
			<RegistrationGuide
				open={showRegistrationGuide}
				trigger="limitation"
				onRegister={handleRegister}
				onLogin={handleLogin}
				onDismiss={() => setShowRegistrationGuide(false)}
			/>
		</div>
	);
}
