"use client";
import {
	BarChartOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	EyeOutlined,
	LoginOutlined,
	RocketOutlined,
	SafetyCertificateOutlined,
	SearchOutlined,
	TeamOutlined,
	UserAddOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Col,
	Input,
	Row,
	Space,
	Statistic,
	Tag,
	Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGuestSession } from "@/hooks/useGuestSession";
import { SearchLimitationBanner } from "./FeatureLimitation";
import { RegistrationGuide } from "./RegistrationGuide";

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

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

interface GuestHomePageProps {
	publicStats: PublicStats;
	recentBlacklist: PublicBlacklistItem[];
}

export default function GuestHomePage({
	publicStats,
	recentBlacklist,
}: GuestHomePageProps) {
	const router = useRouter();
	const { session, incrementUsage, getRemainingCount, isLimitReached } =
		useGuestSession();
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	const remainingSearches = getRemainingCount("search");

	const handleSearch = (value: string) => {
		if (!value.trim()) return;

		// 检查搜索限制
		if (isLimitReached("search")) {
			setShowRegistrationGuide(true);
			return;
		}

		// 增加搜索次数
		if (incrementUsage("search")) {
			// 跳转到搜索结果页面
			router.push(`/search?q=${encodeURIComponent(value)}`);
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
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			{/* 英雄区域 */}
			<section className="relative py-8 px-4">
				<div className="max-w-6xl mx-auto text-center">
					{/* 品牌标识 */}
					<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-8 shadow-2xl">
						<SafetyCertificateOutlined className="text-3xl text-white" />
					</div>

					{/* 主标题 */}
					<Title level={1} className="!mb-6 !text-4xl md:!text-5xl">
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							BlacklistHub
						</span>
					</Title>

					<Title
						level={2}
						className="!mb-6 !text-xl md:!text-2xl !font-normal text-gray-600"
					>
						专业的失信人员查询平台
					</Title>

					<Paragraph className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
						提供全面、准确的失信人员信息查询服务。
						帮助您快速了解个人或企业的信用状况，做出明智的决策。
					</Paragraph>

					{/* 操作按钮 */}
					<Space size="large" className="mb-12">
						<Button
							type="primary"
							size="large"
							icon={<UserAddOutlined />}
							onClick={() => router.push("/register")}
							className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 border-none shadow-lg hover:shadow-xl"
						>
							立即注册
						</Button>
						<Button
							size="large"
							icon={<RocketOutlined />}
							onClick={() => setShowRegistrationGuide(true)}
							className="h-12 px-8"
						>
							游客模式体验
						</Button>
						<Button
							size="large"
							icon={<LoginOutlined />}
							onClick={() => router.push("/login")}
							className="h-12 px-8"
						>
							用户登录
						</Button>
					</Space>
				</div>
			</section>

			{/* 快速搜索区域 */}
			<section className="px-4 bg-white/50">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-8">
						<Title level={3} className="!mb-4">
							🔍 快速失信查询
						</Title>
						<Text className="text-gray-600">
							输入姓名、身份证号、企业名称等信息，快速查询失信记录
						</Text>
					</div>

					{/* 搜索限制提示 */}
					{session && (
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
					<div className="max-w-2xl mx-auto">
						<Search
							placeholder="输入姓名、身份证号、企业名称..."
							size="large"
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							onSearch={handleSearch}
							enterButton={
								<Button
									type="primary"
									icon={<SearchOutlined />}
									size="large"
									disabled={isLimitReached("search")}
									className="bg-gradient-to-r from-blue-500 to-purple-600 border-none"
								>
									{isLimitReached("search") ? "已达限制" : "立即查询"}
								</Button>
							}
							className="guest-search-input"
						/>
						<div className="text-center mt-3 text-sm text-gray-500">
							游客每日可免费查询 {session?.limitations.maxSearchPerDay || 10} 次
						</div>
					</div>
				</div>
			</section>

			{/* 平台统计 */}
			<section className="py-8 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<Title level={3} className="!mb-4">
							📊 平台数据概览
						</Title>
						<Text className="text-gray-600">
							实时更新的失信数据，为您的决策提供可靠依据
						</Text>
					</div>

					<Row gutter={[24, 24]}>
						<Col xs={12} sm={6}>
							<Card className="text-center hover:shadow-lg transition-shadow">
								<Statistic
									title="失信记录总数"
									value={publicStats.totalBlacklist}
									prefix={<SafetyCertificateOutlined />}
									valueStyle={{ color: "#1890ff" }}
								/>
							</Card>
						</Col>
						<Col xs={12} sm={6}>
							<Card className="text-center hover:shadow-lg transition-shadow">
								<Statistic
									title="已发布条目"
									value={publicStats.publishedCount}
									prefix={<CheckCircleOutlined />}
									valueStyle={{ color: "#52c41a" }}
								/>
							</Card>
						</Col>
						<Col xs={12} sm={6}>
							<Card className="text-center hover:shadow-lg transition-shadow">
								<Statistic
									title="月度增长"
									value={publicStats.monthlyGrowth}
									suffix="%"
									prefix={<BarChartOutlined />}
									valueStyle={{ color: "#fa8c16" }}
								/>
							</Card>
						</Col>
						<Col xs={12} sm={6}>
							<Card className="text-center hover:shadow-lg transition-shadow">
								<Statistic
									title="活跃贡献者"
									value={publicStats.activeContributors}
									prefix={<TeamOutlined />}
									valueStyle={{ color: "#722ed1" }}
								/>
							</Card>
						</Col>
					</Row>
				</div>
			</section>

			{/* 最新黑名单 */}
			<section className="py-8 px-4 bg-gray-50">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<Title level={3} className="!mb-4">
							📋 最新失信名单
						</Title>
						<Text className="text-gray-600">
							最近更新的公开失信人员信息，帮助您了解最新失信记录
						</Text>
					</div>

					<Row gutter={[16, 16]}>
						{recentBlacklist.length > 0 ? (
							recentBlacklist.map((item) => (
								<Col xs={24} sm={12} lg={8} key={item.id}>
									<Card
										size="small"
										className="hover:shadow-md transition-shadow cursor-pointer"
										onClick={() => router.push(`/blacklist/public/${item.id}`)}
									>
										<div className="flex items-center justify-between mb-2">
											<Tag color="blue">
												{item.type === "person"
													? "个人"
													: item.type === "company"
														? "企业"
														: item.type === "organization"
															? "组织"
															: "其他"}
											</Tag>
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
										<div className="text-sm text-gray-600 mb-2 truncate">
											{item.value}
										</div>
										<div className="flex items-center text-xs text-gray-400">
											<ClockCircleOutlined className="mr-1" />
											{new Date(item.createdAt).toLocaleDateString()}
										</div>
									</Card>
								</Col>
							))
						) : (
							<Col span={24}>
								<div className="text-center py-8 text-gray-500">
									<SafetyCertificateOutlined className="text-4xl mb-4 text-gray-300" />
									<div>暂无公开失信记录</div>
									<div className="text-sm mt-2">数据正在更新中，请稍后查看</div>
								</div>
							</Col>
						)}
					</Row>

					<div className="text-center mt-8">
						<Link href="/blacklist/public">
							<Button icon={<EyeOutlined />} size="large">
								查看更多黑名单
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* 功能特性 */}
			<section className="py-8 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<Title level={3} className="!mb-4">
							💼 我们能为您做什么
						</Title>
						<Text className="text-gray-600 text-lg">
							帮助您在商业决策中规避风险，保护资产安全
						</Text>
					</div>

					<Row gutter={[24, 24]}>
						<Col xs={24} sm={12} lg={6}>
							<Card className="text-center h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
								<div className="text-4xl mb-4">💰</div>
								<Title level={4} className="!text-blue-700">避免经济损失</Title>
								<Paragraph className="text-gray-600">
									提前识别失信人员，避免<br/>
									<strong className="text-blue-600">合作风险</strong>，保护您的资金安全
								</Paragraph>
							</Card>
						</Col>
						<Col xs={24} sm={12} lg={6}>
							<Card className="text-center h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
								<div className="text-4xl mb-4">⏰</div>
								<Title level={4} className="!text-green-700">节省时间成本</Title>
								<Paragraph className="text-gray-600">
									<strong className="text-green-600">快速查询</strong>替代繁琐调查<br/>
									让您专注核心业务发展
								</Paragraph>
							</Card>
						</Col>
						<Col xs={24} sm={12} lg={6}>
							<Card className="text-center h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
								<div className="text-4xl mb-4">🎯</div>
								<Title level={4} className="!text-purple-700">提升决策质量</Title>
								<Paragraph className="text-gray-600">
									基于真实信用记录，做出<br/>
									<strong className="text-purple-600">更明智的商业决策</strong>
								</Paragraph>
							</Card>
						</Col>
						<Col xs={24} sm={12} lg={6}>
							<Card className="text-center h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100">
								<div className="text-4xl mb-4">🛡️</div>
								<Title level={4} className="!text-orange-700">降低法律风险</Title>
								<Paragraph className="text-gray-600">
									了解合作方信用状况<br/>
									<strong className="text-orange-600">减少纠纷和诉讼</strong>风险
								</Paragraph>
							</Card>
						</Col>
					</Row>
				</div>
			</section>

			{/* 注册引导模态框 */}
			<RegistrationGuide
				open={showRegistrationGuide}
				trigger="feature"
				onRegister={handleRegister}
				onLogin={handleLogin}
				onDismiss={() => setShowRegistrationGuide(false)}
			/>

			{/* 自定义样式 */}
			<style jsx={true} global={true}>{`
				.guest-search-input .ant-input-group-addon {
					background: transparent;
					border: none;
				}

				.guest-search-input .ant-input {
					border-radius: 12px 0 0 12px;
					border-right: none;
					height: 48px;
				}

				.guest-search-input .ant-btn {
					border-radius: 0 12px 12px 0;
					height: 48px !important;
					display: flex;
					align-items: center;
					justify-content: center;
				}
			`}</style>
		</div>
	);
}
