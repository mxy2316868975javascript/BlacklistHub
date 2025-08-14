/**
 * 黑名单预览页面
 *
 * 功能说明：
 * - 为非特权用户（非举报者、审核员、管理员、超管）提供纯净的只读预览界面
 * - 特权用户访问时会自动重定向到完整的管理界面
 * - 提供清晰的信息展示，包括基本信息、详细说明和统计数据
 * - 包含免责声明，确保信息使用的合规性
 *
 * 访问方式：
 * 1. 通过黑名单列表页面的"预览"按钮
 * 2. 直接访问 /blacklist/[id]/preview
 *
 * 权限控制：
 * - 普通用户：显示预览界面
 * - 特权用户：重定向到管理界面
 * - 未登录用户：允许查看预览（可根据需要调整）
 */
"use client";
import "@ant-design/v5-patch-for-react-19";
import {
	CopyOutlined,
	InfoCircleOutlined,
	PrinterOutlined,
	ShareAltOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Descriptions,
	Divider,
	message,
	Row,
	Space,
	Tag,
	Tooltip,
	Typography,
} from "antd";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
	type BlacklistItem,
	getRegionLabel,
	getSourceLabel,
} from "@/types/blacklist";
import {
	getBlacklistStatusColor,
	getBlacklistStatusLabel,
	getBlacklistTypeLabel,
	getReasonCodeLabel,
	getRiskLevelColor,
	getRiskLevelLabel,
} from "@/types/enums";
import type { UserInfo } from "@/types/user";

// 使用共享的BlacklistItem类型，但添加本页面特有的字段
type BlackItem = BlacklistItem & {
	sources?: string[];
	timeline?: { action: string; by: string; at: string; note?: string }[];
};

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function BlacklistPreviewPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

	// 获取当前用户信息
	useEffect(() => {
		const fetchUserInfo = async () => {
			try {
				const response = await axios.get("/api/me");
				const user = response.data.user;
				setCurrentUser(user);

				// 预览页面允许所有用户查看，包括特权用户
				// 特权用户会看到提示，可以选择跳转到管理界面
				setCurrentUser(user);
				setIsAuthorized(true);
			} catch (error) {
				console.error("Failed to fetch user info:", error);
				// 如果获取用户信息失败，可能是未登录用户，允许查看预览
				setIsAuthorized(true);
				setCurrentUser(null);
			}
		};

		fetchUserInfo();
	}, []);

	const { data, error } = useSWR(
		isAuthorized ? `/api/blacklist/${params.id}` : null,
		fetcher,
	);
	const item: BlackItem | undefined = data;

	// 如果权限检查还在进行中
	if (isAuthorized === null) {
		return (
			<div className="p-6 flex justify-center items-center min-h-[400px]">
				<div className="text-center">
					<div className="text-lg">正在验证访问权限...</div>
				</div>
			</div>
		);
	}

	// 检查用户是否有管理权限
	const hasManagementAccess = () => {
		if (!currentUser) return false;
		const managementRoles = ["reporter", "reviewer", "admin", "super_admin"];
		return managementRoles.includes(currentUser.role);
	};

	// 加载中状态
	if (!item && !error) {
		return (
			<div className="p-6 flex justify-center items-center min-h-[400px]">
				<div className="text-center">
					<div className="text-lg">加载中...</div>
				</div>
			</div>
		);
	}

	// 错误状态
	if (error) {
		return (
			<div className="p-6">
				<Alert
					message="加载失败"
					description="无法加载黑名单条目信息，请稍后重试。"
					type="error"
					showIcon
					action={
						<Space>
							<Button size="small" onClick={() => window.location.reload()}>
								重试
							</Button>
							<Button size="small" onClick={() => router.push("/")}>
								返回列表
							</Button>
						</Space>
					}
				/>
			</div>
		);
	}

	if (!item) {
		return (
			<div className="p-6">
				<Alert
					message="条目不存在"
					description="请求的黑名单条目不存在或已被删除。"
					type="warning"
					showIcon
					action={
						<Button size="small" onClick={() => router.push("/")}>
							返回列表
						</Button>
					}
				/>
			</div>
		);
	}

	// 使用统一的枚举函数（从 enums.ts 导入）

	// 分享功能
	const handleShare = async () => {
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `黑名单条目 - ${item.value}`,
					text: `查看黑名单条目：${item.value}`,
					url: url,
				});
			} else {
				await navigator.clipboard.writeText(url);
				message.success("链接已复制到剪贴板");
			}
		} catch (error) {
			console.error("分享失败:", error);
			message.error("分享失败");
		}
	};

	// 打印功能
	const handlePrint = () => {
		window.print();
	};

	// 复制失信人名称功能
	const handleCopyValue = async () => {
		try {
			await navigator.clipboard.writeText(item.value);
			message.success("失信人名称已复制到剪贴板");
		} catch (error) {
			console.error("复制失败:", error);
			message.error("复制失败");
		}
	};

	return (
		<>
			{/* 打印样式 */}
			<style jsx global>{`
				@media print {
					.no-print {
						display: none !important;
					}
					.print-break {
						page-break-inside: avoid;
					}
					body {
						-webkit-print-color-adjust: exact;
						color-adjust: exact;
					}
				}
			`}</style>

			<div className="p-6 max-w-6xl mx-auto">
				{/* 特权用户提示 */}
				{hasManagementAccess() && (
					<Alert
						message="管理员提示"
						description={
							<div>
								<p>
									您拥有 {currentUser?.role}{" "}
									权限，可以使用完整的管理界面进行编辑。
								</p>
								<Space className="mt-2">
									<Button
										type="primary"
										size="small"
										onClick={() => router.push(`/blacklist/${params.id}`)}
									>
										前往管理页面
									</Button>
								</Space>
							</div>
						}
						type="info"
						showIcon
						closable
						className="!mb-6 no-print"
					/>
				)}

				<div className="mb-6 flex justify-between items-center no-print">
					<Button onClick={() => router.push("/")}>← 返回列表</Button>
					<Space>
						<Tooltip title="复制失信人名称">
							<Button icon={<CopyOutlined />} onClick={handleCopyValue}>
								复制失信人名称
							</Button>
						</Tooltip>
						<Tooltip title="分享此页面">
							<Button icon={<ShareAltOutlined />} onClick={handleShare}>
								分享
							</Button>
						</Tooltip>
						<Tooltip title="打印此页面">
							<Button icon={<PrinterOutlined />} onClick={handlePrint}>
								打印
							</Button>
						</Tooltip>
					</Space>
				</div>

				<Row gutter={[24, 24]}>
					<Col xs={24} lg={16}>
						<Card className="print-break">
							<div className="mb-6">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<Typography.Title
											level={2}
											style={{ margin: 0, color: "#1890ff" }}
											className="break-all"
										>
											{item.value}
										</Typography.Title>
										<div className="mt-3 flex flex-wrap gap-3">
											<Tag color="blue" className="text-sm px-3 py-1">
												{getBlacklistTypeLabel(item.type)}
											</Tag>
											<Tag
												color={getRiskLevelColor(item.risk_level)}
												className="text-sm px-3 py-1"
											>
												风险等级：{getRiskLevelLabel(item.risk_level)}
											</Tag>
											<Tag
												color={getBlacklistStatusColor(item.status)}
												className="text-sm px-3 py-1"
											>
												状态：{getBlacklistStatusLabel(item.status)}
											</Tag>
											{item.expires_at && (
												<Tooltip
													title={`到期时间：${new Date(item.expires_at).toLocaleString()}`}
												>
													<Tag color="orange" className="text-sm px-3 py-1">
														<InfoCircleOutlined className="mr-1" />
														有到期时间
													</Tag>
												</Tooltip>
											)}
										</div>
									</div>
								</div>
							</div>

							<Divider />

							<div className="space-y-6">
								<div>
									<Typography.Title level={4}>基本信息</Typography.Title>
									<Descriptions bordered column={2} size="middle">
										<Descriptions.Item label="类型" span={1}>
											{getBlacklistTypeLabel(item.type)}
										</Descriptions.Item>
										<Descriptions.Item label="失信人名称" span={1}>
											<Typography.Text copyable>{item.value}</Typography.Text>
										</Descriptions.Item>
										<Descriptions.Item label="风险等级" span={1}>
											<Tag color={getRiskLevelColor(item.risk_level)}>
												{getRiskLevelLabel(item.risk_level)}
											</Tag>
										</Descriptions.Item>
										<Descriptions.Item label="理由码" span={1}>
											{getReasonCodeLabel(item.reason_code)}
										</Descriptions.Item>
										<Descriptions.Item label="来源" span={1}>
											{getSourceLabel(item.source)}
										</Descriptions.Item>
										<Descriptions.Item label="地区" span={1}>
											{item.region ? getRegionLabel(item.region) : "未指定"}
										</Descriptions.Item>
										{item.expires_at && (
											<Descriptions.Item label="到期时间" span={2}>
												{new Date(item.expires_at).toLocaleString()}
											</Descriptions.Item>
										)}
									</Descriptions>
								</div>

								{item.reason && (
									<div>
										<Typography.Title level={4}>详细说明</Typography.Title>
										<Card className="bg-gray-50">
											<MarkdownRenderer content={item.reason} />
										</Card>
									</div>
								)}
							</div>
						</Card>
					</Col>

					<Col xs={24} lg={8}>
						<Card title="统计信息" className="mb-4">
							<Descriptions column={1} size="small">
								<Descriptions.Item label="举报次数">
									{item.sources?.length ?? 0}
								</Descriptions.Item>
								<Descriptions.Item label="创建时间">
									{new Date(item.created_at).toLocaleString()}
								</Descriptions.Item>
								<Descriptions.Item label="最近更新">
									{new Date(item.updated_at).toLocaleString()}
								</Descriptions.Item>
							</Descriptions>
						</Card>

						<Card title="免责声明" className="mb-4">
							<div className="text-sm text-gray-600 space-y-2">
								<p>• 本信息仅供参考，不构成法律建议</p>
								<p>• 请在使用前验证信息的准确性</p>
								<p>• 如有异议，请联系相关管理员</p>
							</div>
						</Card>
					</Col>
				</Row>
			</div>
		</>
	);
}
