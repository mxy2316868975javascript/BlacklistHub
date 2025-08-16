"use client";
import {
	EyeOutlined,
	InfoCircleOutlined,
	LockOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Input,
	Pagination,
	Select,
	Space,
	Table,
	Tag,
	Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ViewLimitationBanner } from "@/components/guest/FeatureLimitation";

import { RegistrationGuide } from "@/components/guest/RegistrationGuide";
import { useAuth } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";

const { Title, Text } = Typography;
const { Search } = Input;

interface PublicBlacklistItem {
	id: string;
	type: string;
	value: string;
	riskLevel: "low" | "medium" | "high";
	reasonCode: string;
	createdAt: string;
	status: "published";
	// 游客模式下隐藏的字段已被过滤
}

export default function PublicBlacklistPage() {
	const router = useRouter();
	const { isGuest } = useAuth();
	const { session, incrementUsage, getRemainingCount, isLimitReached } =
		useGuestSession();

	const [data, setData] = useState<PublicBlacklistItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchText, setSearchText] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("");
	const [riskFilter, setRiskFilter] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize] = useState(20);
	const [total, setTotal] = useState(0);
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);

	const remainingViews = getRemainingCount("view");

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			// 构建查询参数
			const params = new URLSearchParams({
				page: currentPage.toString(),
				pageSize: pageSize.toString(),
			});

			if (searchText) {
				params.append('search', searchText);
			}
			if (typeFilter) {
				params.append('type', typeFilter);
			}
			if (riskFilter) {
				params.append('riskLevel', riskFilter);
			}

			// 调用真实的API
			const response = await fetch(`/api/guest/blacklist/public?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch data: ${response.status}`);
			}

			const result = await response.json();
			setData(result.data || []);
			setTotal(result.pagination?.total || 0);
		} catch (error) {
			console.error("Failed to load blacklist data:", error);
			setData([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [currentPage, pageSize, searchText, typeFilter, riskFilter]);

	// 数据加载
	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleViewDetails = (record: PublicBlacklistItem) => {
		// 检查查看限制
		if (isLimitReached("view")) {
			setShowRegistrationGuide(true);
			return;
		}

		// 增加查看次数
		if (incrementUsage("view")) {
			// 跳转到详情页面
			router.push(`/blacklist/public/${record.id}`);
		} else {
			setShowRegistrationGuide(true);
		}
	};

	const handleSearch = (value: string) => {
		setSearchText(value);
		setCurrentPage(1);
	};

	const handleRegister = () => {
		setShowRegistrationGuide(false);
		router.push("/register");
	};

	const handleLogin = () => {
		setShowRegistrationGuide(false);
		router.push("/login");
	};

	// 表格列定义
	const columns: ColumnsType<PublicBlacklistItem> = [
		{
			title: "类型",
			dataIndex: "type",
			key: "type",
			width: 80,
			render: (type: string) => (
				<Tag
					color={
						type === "person" ? "blue" : type === "company" ? "green" : "orange"
					}
				>
					{type === "person" ? "个人" : type === "company" ? "企业" : type === "organization" ? "组织" : "其他"}
				</Tag>
			),
		},
		{
			title: "失信主体",
			dataIndex: "value",
			key: "value",
			ellipsis: true,
			render: (value: string) => (
				<Text code={true} className="text-sm">
					{value}
				</Text>
			),
		},
		{
			title: "失信等级",
			dataIndex: "riskLevel",
			key: "riskLevel",
			width: 100,
			render: (level: string) => (
				<Tag
					color={
						level === "high" ? "red" : level === "medium" ? "orange" : "green"
					}
				>
					{level === "high"
						? "严重失信"
						: level === "medium"
							? "一般失信"
							: "轻微失信"}
				</Tag>
			),
		},
		{
			title: "理由码",
			dataIndex: "reasonCode",
			key: "reasonCode",
			width: 120,
			render: (code: string) => (
				<Text className="text-xs text-gray-500">{code}</Text>
			),
		},
		{
			title: "创建时间",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 120,
			render: (date: string) => (
				<Text className="text-xs text-gray-500">
					{new Date(date).toLocaleDateString()}
				</Text>
			),
		},
		{
			title: "操作",
			key: "action",
			width: 100,
			render: (_, record) => (
				<Button
					type="link"
					size="small"
					icon={<EyeOutlined />}
					onClick={() => handleViewDetails(record)}
					disabled={isLimitReached("view")}
				>
					{isLimitReached("view") ? "已达限制" : "查看"}
				</Button>
			),
		},
	];

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto p-6">
				{/* 页面标题 */}
				<div className="mb-6">
					<Title level={2} className="!mb-2">
						📋 公开失信名单
					</Title>
					<Text className="text-gray-600">
						查看已发布的公开失信人员信息，了解失信记录
					</Text>
				</div>

				{/* 游客限制提示 */}
				{isGuest && session && (
					<div className="mb-6">
						<ViewLimitationBanner
							remaining={remainingViews}
							total={session.limitations.maxViewPerDay}
							onUpgrade={() => setShowRegistrationGuide(true)}
							severity={remainingViews <= 10 ? "warning" : "info"}
						/>
					</div>
				)}

				{/* 搜索和筛选 */}
				<Card className="mb-6">
					<div className="flex flex-col lg:flex-row gap-4">
						<div className="flex-1">
							<Search
								placeholder="搜索失信人员信息..."
								allowClear={true}
								onSearch={handleSearch}
								className="w-full"
							/>
						</div>
						<div className="flex gap-2">
							<Select
								placeholder="类型"
								allowClear={true}
								value={typeFilter || undefined}
								onChange={setTypeFilter}
								className="w-32"
								options={[
									{ label: "个人", value: "person" },
									{ label: "企业", value: "company" },
									{ label: "组织", value: "organization" },
									{ label: "其他", value: "other" },
								]}
							/>
							<Select
								placeholder="失信等级"
								allowClear={true}
								value={riskFilter || undefined}
								onChange={setRiskFilter}
								className="w-32"
								options={[
									{ label: "严重失信", value: "high" },
									{ label: "一般失信", value: "medium" },
									{ label: "轻微失信", value: "low" },
								]}
							/>
							<Button
								icon={<ReloadOutlined />}
								onClick={loadData}
								loading={loading}
							>
								刷新
							</Button>
						</div>
					</div>
				</Card>

				{/* 游客模式说明 */}
				{isGuest && (
					<Alert
						type="info"
						showIcon={true}
						icon={<InfoCircleOutlined />}
						message="游客模式说明"
						description={
							<div>
								<p>• 您正在以游客身份浏览公开黑名单信息</p>
								<p>• 敏感信息已自动脱敏处理，保护隐私安全</p>
								<p>• 注册后可查看完整详情和更多高级功能</p>
							</div>
						}
						className="mb-6"
					/>
				)}

				{/* 数据表格 */}
				<Card>
					<Table
						columns={columns}
						dataSource={data}
						loading={loading}
						pagination={false}
						rowKey="id"
						size="small"
						scroll={{ x: 800 }}
						locale={{
							emptyText: "暂无公开黑名单数据",
						}}
					/>

					{/* 分页 */}
					<div className="flex justify-between items-center mt-4 pt-4 border-t">
						<div className="text-sm text-gray-500">
							共 {total} 条记录
							{isGuest && (
								<span className="ml-2">（游客模式仅显示公开数据）</span>
							)}
						</div>
						<Pagination
							current={currentPage}
							pageSize={pageSize}
							total={total}
							onChange={setCurrentPage}
							showSizeChanger={false}
							showQuickJumper={!isGuest} // 游客模式禁用快速跳转
							showTotal={(total, range) =>
								`第 ${range[0]}-${range[1]} 条，共 ${total} 条`
							}
						/>
					</div>
				</Card>

				{/* 游客模式底部提示 */}
				{isGuest && (
					<div className="mt-8 text-center">
						<Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
							<div className="py-6">
								<div className="text-4xl mb-4">🚀</div>
								<Title level={4} className="!mb-2">
									想要查看更多详细信息？
								</Title>
								<Text className="text-gray-600 mb-4 block">
									注册后解锁完整的黑名单详情、历史记录和高级搜索功能
								</Text>
								<Space>
									<Button
										type="primary"
										size="large"
										icon={<LockOutlined />}
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
					</div>
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
