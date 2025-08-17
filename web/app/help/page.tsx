"use client";
import {
	BookOutlined,
	CustomerServiceOutlined,
	RocketOutlined,
	SafetyCertificateOutlined,
	SearchOutlined,
	UserAddOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Collapse,
	Row,
	Space,
	Steps,
	Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RegistrationGuide } from "@/components/guest/RegistrationGuide";
import { useAuth } from "@/hooks/useAuth";

const { Title, Paragraph, Text } = Typography;

export default function HelpPage() {
	const router = useRouter();
	const { isGuest } = useAuth();
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);

	const handleRegister = () => {
		setShowRegistrationGuide(false);
		router.push("/register");
	};

	const handleLogin = () => {
		setShowRegistrationGuide(false);
		router.push("/login");
	};

	// 游客专用FAQ
	const guestFaq = [
		{
			key: "1",
			label: "什么是游客模式？",
			children: (
				<div>
					<Paragraph>
						游客模式允许您在不注册的情况下体验BlacklistHub的核心功能。您可以：
					</Paragraph>
					<ul className="list-disc list-inside space-y-1 text-gray-600">
						<li>每日免费查询10次</li>
						<li>查看公开的失信人员信息</li>
						<li>浏览平台统计数据</li>
						<li>访问帮助文档</li>
					</ul>
					<Alert
						type="info"
						message="注册后可解锁无限制访问和更多高级功能"
						className="mt-3"
					/>
				</div>
			),
		},
		{
			key: "2",
			label: "游客模式有什么限制？",
			children: (
				<div>
					<Paragraph>
						为了保护平台资源和数据安全，游客模式有以下限制：
					</Paragraph>
					<Row gutter={[16, 16]}>
						<Col span={12}>
							<Card size="small" title="查询限制">
								<ul className="text-sm space-y-1">
									<li>• 每日最多10次查询</li>
									<li>• 基础查询功能</li>
									<li>• 结果数量限制</li>
								</ul>
							</Card>
						</Col>
						<Col span={12}>
							<Card size="small" title="查看限制">
								<ul className="text-sm space-y-1">
									<li>• 每日最多50次查看</li>
									<li>• 敏感信息脱敏</li>
									<li>• 无法下载数据</li>
								</ul>
							</Card>
						</Col>
					</Row>
				</div>
			),
		},
		{
			key: "3",
			label: "如何开始使用？",
			children: (
				<div>
					<Steps
						direction="vertical"
						size="small"
						items={[
							{
								title: "访问首页",
								description: '进入BlacklistHub首页，选择"游客模式体验"',
								icon: <UserOutlined />,
							},
							{
								title: "开始查询",
								description: "在搜索框中输入要查询的姓名、身份证号或企业名称",
								icon: <SearchOutlined />,
							},
							{
								title: "查看结果",
								description: "浏览查询结果，点击查看失信详细信息",
								icon: <SafetyCertificateOutlined />,
							},
							{
								title: "注册升级",
								description: "达到限制时，注册账户解锁更多功能",
								icon: <RocketOutlined />,
							},
						]}
					/>
				</div>
			),
		},
		{
			key: "4",
			label: "注册有什么好处？",
			children: (
				<div>
					<Row gutter={[16, 16]}>
						<Col xs={24} sm={12}>
							<Card size="small" title="🆓 游客模式" className="h-full">
								<ul className="text-sm space-y-1 text-gray-600">
									<li>• 每日搜索10次</li>
									<li>• 基础信息查看</li>
									<li>• 数据脱敏显示</li>
									<li>• 功能受限</li>
								</ul>
							</Card>
						</Col>
						<Col xs={24} sm={12}>
							<Card
								size="small"
								title="⭐ 注册用户"
								className="h-full border-blue-200 bg-blue-50"
							>
								<ul className="text-sm space-y-1 text-blue-700">
									<li>• 无限制搜索</li>
									<li>• 完整信息查看</li>
									<li>• 创建和编辑</li>
									<li>• 高级功能</li>
									<li>• API访问</li>
									<li>• 专业支持</li>
								</ul>
							</Card>
						</Col>
					</Row>
					<div className="text-center mt-4">
						<Button
							type="primary"
							icon={<UserAddOutlined />}
							onClick={() => setShowRegistrationGuide(true)}
						>
							立即注册
						</Button>
					</div>
				</div>
			),
		},
	];

	// 通用FAQ
	const generalFaq = [
		{
			key: "5",
			label: "什么是失信名单？",
			children: (
				<Paragraph>
					失信名单是包含失信人员和企业信息的数据库。
					这些信息通常与违约、欺诈、不履行法定义务等失信行为相关。
					通过查询失信名单，您可以快速了解个人或企业的信用状况。
				</Paragraph>
			),
		},
		{
			key: "6",
			label: "数据来源是什么？",
			children: (
				<div>
					<Paragraph>我们的失信数据来源于多个权威渠道：</Paragraph>
					<ul className="list-disc list-inside space-y-1 text-gray-600">
						<li>法院执行信息</li>
						<li>政府监管部门</li>
						<li>金融机构报告</li>
						<li>社会信用体系</li>
						<li>企业征信机构</li>
					</ul>
				</div>
			),
		},
		{
			key: "7",
			label: "数据更新频率如何？",
			children: (
				<Paragraph>
					我们的失信数据定期更新，确保您获得最新的信用信息。
					新的失信信息会在核实后及时添加到数据库中，
					已恢复信用或错误的信息也会及时更正。
				</Paragraph>
			),
		},
		{
			key: "8",
			label: "如何保证数据准确性？",
			children: (
				<div>
					<Paragraph>我们采用多重验证机制确保数据质量：</Paragraph>
					<ul className="list-disc list-inside space-y-1 text-gray-600">
						<li>多源数据交叉验证</li>
						<li>专业团队人工审核</li>
						<li>AI算法自动筛选</li>
						<li>社区反馈机制</li>
						<li>定期数据清理</li>
					</ul>
				</div>
			),
		},
	];

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto p-6">
				{/* 页面标题 */}
				<div className="text-center mb-8">
					<Title level={1} className="!mb-4">
						📚 帮助中心
					</Title>
					<Paragraph className="text-lg text-gray-600">
						了解如何使用BlacklistHub，查询失信人员信息
					</Paragraph>
				</div>

				{/* 游客模式特别说明 */}
				{isGuest && (
					<Alert
						type="info"
						showIcon={true}
						icon={<UserOutlined />}
						message="游客模式帮助"
						description="您正在以游客身份浏览帮助文档。注册后可获得更多功能和专业支持。"
						action={
							<Button
								size="small"
								type="primary"
								onClick={() => setShowRegistrationGuide(true)}
							>
								立即注册
							</Button>
						}
						className="mb-6"
					/>
				)}

				{/* 快速开始 */}
				<Card className="mb-6">
					<Title level={3} className="!mb-4">
						🚀 快速开始
					</Title>
					<Row gutter={[24, 24]}>
						<Col xs={24} sm={8}>
							<Card size="small" className="text-center h-full">
								<div className="text-3xl mb-3">🔍</div>
								<Title level={5}>失信查询</Title>
								<Paragraph className="text-sm text-gray-600">
									输入姓名、身份证号，快速查询失信记录
								</Paragraph>
							</Card>
						</Col>
						<Col xs={24} sm={8}>
							<Card size="small" className="text-center h-full">
								<div className="text-3xl mb-3">📋</div>
								<Title level={5}>浏览失信名单</Title>
								<Paragraph className="text-sm text-gray-600">
									查看最新的公开失信人员信息
								</Paragraph>
							</Card>
						</Col>
						<Col xs={24} sm={8}>
							<Card size="small" className="text-center h-full">
								<div className="text-3xl mb-3">📊</div>
								<Title level={5}>查看统计</Title>
								<Paragraph className="text-sm text-gray-600">
									了解平台数据和失信趋势
								</Paragraph>
							</Card>
						</Col>
					</Row>
				</Card>

				{/* 游客专用FAQ */}
				{isGuest && (
					<Card className="mb-6">
						<Title level={3} className="!mb-4">
							❓ 游客模式常见问题
						</Title>
						<Collapse items={guestFaq} defaultActiveKey={["1"]} ghost={true} />
					</Card>
				)}

				{/* 通用FAQ */}
				<Card className="mb-6">
					<Title level={3} className="!mb-4">
						💡 常见问题
					</Title>
					<Collapse items={generalFaq} ghost={true} />
				</Card>

				{/* 支持类型 */}
				<Row gutter={[24, 24]} className="mb-6">
					<Col xs={24} sm={12}>
						<Card>
							<div className="text-center">
								<BookOutlined className="text-3xl text-blue-500 mb-3" />
								<Title level={4}>文档中心</Title>
								<Paragraph className="text-gray-600">
									详细的使用指南和API文档
								</Paragraph>
								<Button type="primary" ghost={true}>
									查看文档
								</Button>
							</div>
						</Card>
					</Col>
					<Col xs={24} sm={12}>
						<Card>
							<div className="text-center">
								<CustomerServiceOutlined className="text-3xl text-green-500 mb-3" />
								<Title level={4}>技术支持</Title>
								<Paragraph className="text-gray-600">
									专业的技术支持团队为您服务
								</Paragraph>
								<Button type="primary" ghost={true}>
									联系支持
								</Button>
							</div>
						</Card>
					</Col>
				</Row>

				{/* 游客升级提示 */}
				{isGuest && (
					<Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
						<div className="text-center py-6">
							<div className="text-4xl mb-4">🎯</div>
							<Title level={3} className="!mb-4">
								需要更多帮助？
							</Title>
							<Paragraph className="text-gray-600 mb-6">
								注册用户可享受优先技术支持、详细使用指南和专业咨询服务
							</Paragraph>
							<Space size="large">
								<Button
									type="primary"
									size="large"
									icon={<UserAddOutlined />}
									onClick={() => setShowRegistrationGuide(true)}
								>
									立即注册
								</Button>
								<Button size="large" onClick={() => router.push("/login")}>
									已有账户
								</Button>
							</Space>
						</div>
					</Card>
				)}

				{/* 联系信息 */}
				<Card className="mt-6">
					<Title level={4} className="!mb-4">
						📞 联系我们
					</Title>
					<Row gutter={[24, 16]}>
						<Col xs={24} sm={8}>
							<div className="text-center">
								<Text strong={true}>邮箱支持</Text>
								<br />
								<Text className="text-gray-600">support@blacklisthub.com</Text>
							</div>
						</Col>
						<Col xs={24} sm={8}>
							<div className="text-center">
								<Text strong={true}>工作时间</Text>
								<br />
								<Text className="text-gray-600">周一至周五 9:00-18:00</Text>
							</div>
						</Col>
						<Col xs={24} sm={8}>
							<div className="text-center">
								<Text strong={true}>响应时间</Text>
								<br />
								<Text className="text-gray-600">
									{isGuest ? "48小时内" : "24小时内"}
								</Text>
							</div>
						</Col>
					</Row>
				</Card>
			</div>

			{/* 注册引导模态框 */}
			<RegistrationGuide
				open={showRegistrationGuide}
				trigger="feature"
				onRegister={handleRegister}
				onLogin={handleLogin}
				onDismiss={() => setShowRegistrationGuide(false)}
			/>
		</div>
	);
}
