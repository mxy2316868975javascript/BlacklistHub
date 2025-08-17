"use client";
import {
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	EditOutlined,
	EyeOutlined,
	FileTextOutlined,
	PlusOutlined,
	SearchOutlined,
	TrophyOutlined,
	UserOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import {
	Avatar,
	Button,
	Card,
	Col,
	Descriptions,
	List,
	Progress,
	Row,
	Space,
	Statistic,
	Tag,
	Typography,
	Divider,
} from "antd";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import useSwr from "swr";

const { Title, Text } = Typography;
const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function Dashboard() {
	const { user } = useAuth();
	const { data: globalStats, error: globalStatsError } = useSwr("/api/stats", fetcher);
	const { data: userStats, error: userStatsError } = useSwr(user ? "/api/user/stats" : null, fetcher);
	const { data: userRecords, error: userRecordsError } = useSwr(user ? "/api/user/records?limit=5" : null, fetcher);
	const { data: userActivities, error: userActivitiesError } = useSwr(user ? "/api/user/activities?limit=5" : null, fetcher);

	// 格式化日期
	const formatDate = (date: string | null) => {
		if (!date) return "未知";
		return new Date(date).toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
	};

	// 角色显示名称映射
	const roleNames = {
		reporter: "举报者",
		reviewer: "审核员",
		admin: "管理员",
		super_admin: "超级管理员"
	};

	// 状态颜色映射
	const statusColors = {
		draft: "default",
		pending: "processing",
		published: "success",
		rejected: "error",
		retracted: "warning"
	};

	// 状态显示名称映射
	const statusNames = {
		draft: "草稿",
		pending: "待审核",
		published: "已发布",
		rejected: "已拒绝",
		retracted: "已撤回"
	};

	// 风险等级颜色映射
	const riskColors = {
		low: "success",
		medium: "warning",
		high: "error"
	};

	// 风险等级显示名称映射
	const riskNames = {
		low: "低风险",
		medium: "中风险",
		high: "高风险"
	};

	// 如果用户未登录，显示提示
	if (!user) {
		return (
			<div className="p-6 flex items-center justify-center min-h-96">
				<Card className="text-center">
					<div className="py-8">
						<UserOutlined className="text-4xl text-gray-400 mb-4" />
						<Title level={4}>请先登录</Title>
						<Text type="secondary">登录后查看您的个人中心</Text>
						<div className="mt-4">
							<Link href="/login">
								<Button type="primary">立即登录</Button>
							</Link>
						</div>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 个人信息卡片 */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={16}>
					<Card title="👤 个人信息" extra={
						<Link href="/settings">
							<Button type="link" icon={<EditOutlined />}>
								编辑资料
							</Button>
						</Link>
					}>
						<div className="flex items-start gap-4">
							<Avatar size={64} icon={<UserOutlined />}>
								{user?.username?.[0]?.toUpperCase()}
							</Avatar>
							<div className="flex-1">
								<Descriptions column={2} size="small">
									<Descriptions.Item label="用户名">{user?.username || "未知"}</Descriptions.Item>
									<Descriptions.Item label="角色">
										<Tag color="blue">{roleNames[user?.role as keyof typeof roleNames] || user?.role || "未知"}</Tag>
									</Descriptions.Item>
									<Descriptions.Item label="注册时间">
										{formatDate(userStats?.joinDate)}
									</Descriptions.Item>
									<Descriptions.Item label="最后登录">
										{formatDate(userStats?.lastLogin)}
									</Descriptions.Item>
									<Descriptions.Item label="账户状态">
										<Tag color="green">正常</Tag>
									</Descriptions.Item>
									<Descriptions.Item label="数据质量">
										<Progress
											percent={userStats?.dataQuality?.accuracy || 0}
											size="small"
											status={userStats?.dataQuality?.accuracy >= 80 ? "success" : "normal"}
										/>
									</Descriptions.Item>
								</Descriptions>
							</div>
						</div>
					</Card>
				</Col>
				<Col xs={24} lg={8}>
					<Card title="🚀 快捷操作">
						<Space direction="vertical" className="w-full">
							<Link href="/blacklist/new">
								<Button type="primary" icon={<PlusOutlined />} block>
									举报失信
								</Button>
							</Link>
							<Link href="/search">
								<Button icon={<SearchOutlined />} block>
									快速查询
								</Button>
							</Link>
							<Link href="/blacklist">
								<Button icon={<FileTextOutlined />} block>
									我的记录
								</Button>
							</Link>
						</Space>
					</Card>
				</Col>
			</Row>

			{/* 统计数据 */}
			<Row gutter={[16, 16]}>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title="我的贡献"
							value={userStats?.totalRecords ?? 0}
							prefix={<TrophyOutlined />}
							valueStyle={{ color: '#1890ff' }}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title="已发布记录"
							value={userStats?.publishedRecords ?? 0}
							prefix={<CheckCircleOutlined />}
							valueStyle={{ color: '#52c41a' }}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title="本月新增"
							value={userStats?.thisMonthRecords ?? 0}
							prefix={<CalendarOutlined />}
							valueStyle={{ color: '#722ed1' }}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title="通过率"
							value={userStats?.approvalRate ?? 0}
							suffix="%"
							prefix={<WarningOutlined />}
							valueStyle={{ color: userStats?.approvalRate >= 80 ? '#52c41a' : userStats?.approvalRate >= 60 ? '#faad14' : '#f5222d' }}
						/>
					</Card>
				</Col>
			</Row>

			{/* 记录状态分布和数据质量 */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={12}>
					<Card title="📊 记录状态分布" loading={!userStats && !userStatsError}>
						{userStats?.statusDistribution && Object.keys(userStats.statusDistribution).length > 0 ? (
							<div className="space-y-3">
								{Object.entries(userStats.statusDistribution).map(([status, count]) => (
									<div key={status} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Tag color={statusColors[status as keyof typeof statusColors]}>
												{statusNames[status as keyof typeof statusNames]}
											</Tag>
										</div>
										<div className="flex items-center gap-2">
											<Text strong>{count as number}</Text>
											<Progress
												percent={Math.round(((count as number) / (userStats.totalRecords || 1)) * 100)}
												size="small"
												showInfo={false}
												style={{ width: 60 }}
											/>
										</div>
									</div>
								))}
							</div>
						) : userStatsError ? (
							<div className="text-center py-4">
								<WarningOutlined className="text-red-500 text-2xl mb-2" />
								<div>
									<Text type="danger">加载失败</Text>
								</div>
							</div>
						) : (
							<div className="text-center py-8">
								<FileTextOutlined className="text-gray-400 text-3xl mb-3" />
								<div>
									<Text type="secondary">暂无记录</Text>
									<br />
									<Link href="/blacklist/new">
										<Button type="link" size="small">创建第一条记录</Button>
									</Link>
								</div>
							</div>
						)}
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title="🎯 风险等级分布" loading={!userStats && !userStatsError}>
						{userStats?.riskDistribution && Object.keys(userStats.riskDistribution).length > 0 ? (
							<div className="space-y-3">
								{Object.entries(userStats.riskDistribution).map(([risk, count]) => (
									<div key={risk} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Tag color={riskColors[risk as keyof typeof riskColors]}>
												{riskNames[risk as keyof typeof riskNames]}
											</Tag>
										</div>
										<div className="flex items-center gap-2">
											<Text strong>{count as number}</Text>
											<Progress
												percent={Math.round(((count as number) / (userStats.totalRecords || 1)) * 100)}
												size="small"
												showInfo={false}
												style={{ width: 60 }}
												strokeColor={
													risk === "high" ? "#f5222d" :
													risk === "medium" ? "#faad14" : "#52c41a"
												}
											/>
										</div>
									</div>
								))}
							</div>
						) : userStatsError ? (
							<div className="text-center py-4">
								<WarningOutlined className="text-red-500 text-2xl mb-2" />
								<div>
									<Text type="danger">加载失败</Text>
								</div>
							</div>
						) : (
							<div className="text-center py-8">
								<TrophyOutlined className="text-gray-400 text-3xl mb-3" />
								<div>
									<Text type="secondary">暂无风险数据</Text>
									<br />
									<Text type="secondary" className="text-xs">创建记录后查看风险分布</Text>
								</div>
							</div>
						)}
					</Card>
				</Col>
			</Row>

			{/* 最近记录和活动 */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={12}>
					<Card
						title="📝 最近记录"
						extra={
							<Link href="/blacklist">
								<Button type="link" size="small">
									查看全部
								</Button>
							</Link>
						}
					>
						{userRecords?.records?.length > 0 ? (
							<List
								size="small"
								dataSource={userRecords.records}
								renderItem={(record: any) => (
									<List.Item
										actions={[
											<Link key="view" href={`/blacklist/${record._id}`}>
												<Button type="link" size="small" icon={<EyeOutlined />}>
													查看
												</Button>
											</Link>
										]}
									>
										<List.Item.Meta
											title={
												<div className="flex items-center gap-2">
													<Text ellipsis style={{ maxWidth: 200 }}>
														{record.value}
													</Text>
													<Tag color={statusColors[record.status as keyof typeof statusColors]} size="small">
														{statusNames[record.status as keyof typeof statusNames]}
													</Tag>
												</div>
											}
											description={
												<div className="flex items-center gap-2 text-xs">
													<Tag color={riskColors[record.risk_level as keyof typeof riskColors]} size="small">
														{riskNames[record.risk_level as keyof typeof riskNames]}
													</Tag>
													<Text type="secondary">
														{new Date(record.created_at).toLocaleDateString()}
													</Text>
												</div>
											}
										/>
									</List.Item>
								)}
							/>
						) : (
							<div className="text-center py-8">
								<Text type="secondary">暂无记录</Text>
								<br />
								<Link href="/blacklist/new">
									<Button type="link">创建第一条记录</Button>
								</Link>
							</div>
						)}
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title="🕒 最近活动">
						{userActivities?.activities?.length > 0 ? (
							<List
								size="small"
								dataSource={userActivities.activities}
								renderItem={(activity: any) => (
									<List.Item>
										<List.Item.Meta
											avatar={<ClockCircleOutlined />}
											title={activity.action}
											description={
												<div className="text-xs">
													<Text type="secondary">
														{new Date(activity.timestamp).toLocaleString()}
													</Text>
												</div>
											}
										/>
									</List.Item>
								)}
							/>
						) : (
							<div className="text-center py-8">
								<Text type="secondary">暂无活动记录</Text>
							</div>
						)}
					</Card>
				</Col>
			</Row>

			{/* 全局统计（保留原有功能） */}
			<Divider orientation="left">系统统计</Divider>
			<Row gutter={[16, 16]}>
				<Col xs={12} sm={8}>
					<Card>
						<Statistic title="黑名单总数" value={globalStats?.total ?? 0} />
					</Card>
				</Col>
				<Col xs={12} sm={8}>
					<Card>
						<Statistic title="已发布记录" value={globalStats?.published ?? 0} />
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card>
						<Statistic title="今日新增" value={globalStats?.today ?? 0} />
					</Card>
				</Col>
			</Row>
		</div>
	);
}
