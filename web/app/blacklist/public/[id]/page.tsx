"use client";
import {
	CopyOutlined,
	InfoCircleOutlined,
	ShareAltOutlined,
	ArrowLeftOutlined,
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
	Spin,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useAuth } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";
import { RegistrationGuide } from "@/components/guest/RegistrationGuide";

const { Title, Text } = Typography;

interface PublicBlacklistDetail {
	id: string;
	type: string;
	value: string;
	riskLevel: "low" | "medium" | "high";
	reasonCode: string;
	reason?: string;
	source?: string;
	region?: string;
	createdAt: string;
	status: "published";
}

/**
 * 数据脱敏处理
 */
function maskSensitiveData(value: string, type: string): string {
	switch (type.toLowerCase()) {
		case "person": {
			if (value.length >= 2) {
				return value.length === 2
					? `${value[0]}*`
					: `${value[0]}${"*".repeat(value.length - 2)}${value[value.length - 1]}`;
			}
			return value;
		}
		case "company": {
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			if (value.length > 4) {
				return `${value.substring(0, 1)}***${value.substring(value.length - 1)}`;
			}
			return value;
		}
		case "organization": {
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			if (value.length > 4) {
				return `${value.substring(0, 1)}***${value.substring(value.length - 1)}`;
			}
			return value;
		}
		default:
			if (value.length > 6) {
				return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
			}
			return value;
	}
}

export default function PublicBlacklistDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { isGuest } = useAuth();
	const { session, incrementUsage, isLimitReached } = useGuestSession();
	
	const [item, setItem] = useState<PublicBlacklistDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);

	useEffect(() => {
		const fetchDetail = async () => {
			try {
				setLoading(true);
				
				// 检查查看限制
				if (isGuest && isLimitReached("view")) {
					setShowRegistrationGuide(true);
					return;
				}

				// 增加查看次数
				if (isGuest && !incrementUsage("view")) {
					setShowRegistrationGuide(true);
					return;
				}

				const response = await fetch(`/api/guest/blacklist/public/${params.id}`);
				
				if (!response.ok) {
					if (response.status === 404) {
						setError("记录不存在或已被删除");
					} else {
						setError("加载失败，请稍后重试");
					}
					return;
				}

				const data = await response.json();
				setItem(data);
			} catch (err) {
				console.error("Failed to fetch blacklist detail:", err);
				setError("网络错误，请检查网络连接");
			} finally {
				setLoading(false);
			}
		};

		fetchDetail();
	}, [params.id, isGuest, incrementUsage, isLimitReached]);

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "person": return "个人";
			case "company": return "企业";
			case "organization": return "组织";
			default: return "其他";
		}
	};

	const getRiskLevelLabel = (level: string) => {
		switch (level) {
			case "high": return "严重失信";
			case "medium": return "一般失信";
			case "low": return "轻微失信";
			default: return level;
		}
	};

	const getRiskLevelColor = (level: string) => {
		switch (level) {
			case "high": return "red";
			case "medium": return "orange";
			case "low": return "green";
			default: return "default";
		}
	};

	const handleShare = async () => {
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `失信记录 - ${item?.value}`,
					text: `查看失信记录：${item?.value}`,
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

	const handleCopyValue = async () => {
		if (!item) return;
		try {
			await navigator.clipboard.writeText(item.value);
			message.success("失信人名称已复制到剪贴板");
		} catch (error) {
			console.error("复制失败:", error);
			message.error("复制失败");
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

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Spin size="large" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 p-6">
				<div className="max-w-4xl mx-auto">
					<Alert
						message="加载失败"
						description={error}
						type="error"
						showIcon={true}
						action={
							<Space>
								<Button size="small" onClick={() => window.location.reload()}>
									重试
								</Button>
								<Button size="small" onClick={() => router.push("/blacklist/public")}>
									返回列表
								</Button>
							</Space>
						}
					/>
				</div>
			</div>
		);
	}

	if (!item) {
		return (
			<div className="min-h-screen bg-gray-50 p-6">
				<div className="max-w-4xl mx-auto">
					<Alert
						message="记录不存在"
						description="请求的失信记录不存在或已被删除。"
						type="warning"
						showIcon={true}
						action={
							<Button size="small" onClick={() => router.push("/blacklist/public")}>
								返回列表
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto p-6">
				{/* 页面头部 */}
				<div className="mb-6 flex justify-between items-center">
					<Button 
						icon={<ArrowLeftOutlined />}
						onClick={() => router.push("/blacklist/public")}
					>
						返回列表
					</Button>
					<Space>
						<Tooltip title="复制失信人名称">
							<Button icon={<CopyOutlined />} onClick={handleCopyValue}>
								复制
							</Button>
						</Tooltip>
						<Tooltip title="分享此页面">
							<Button icon={<ShareAltOutlined />} onClick={handleShare}>
								分享
							</Button>
						</Tooltip>
					</Space>
				</div>

				<Row gutter={[24, 24]}>
					<Col xs={24} lg={16}>
						<Card>
							<div className="mb-6">
								<Title level={2} className="!mb-4 text-blue-600">
									{maskSensitiveData(item.value, item.type)}
								</Title>
								<div className="flex flex-wrap gap-3">
									<Tag color="blue" className="text-sm px-3 py-1">
										{getTypeLabel(item.type)}
									</Tag>
									<Tag
										color={getRiskLevelColor(item.riskLevel)}
										className="text-sm px-3 py-1"
									>
										{getRiskLevelLabel(item.riskLevel)}
									</Tag>
									<Tag color="green" className="text-sm px-3 py-1">
										已发布
									</Tag>
								</div>
							</div>

							<Divider />

							<div className="space-y-6">
								<div>
									<Title level={4}>基本信息</Title>
									<Descriptions bordered={true} column={2} size="middle">
										<Descriptions.Item label="类型" span={1}>
											{getTypeLabel(item.type)}
										</Descriptions.Item>
										<Descriptions.Item label="失信主体" span={1}>
											<Text copyable={true}>
												{maskSensitiveData(item.value, item.type)}
											</Text>
										</Descriptions.Item>
										<Descriptions.Item label="失信等级" span={1}>
											<Tag color={getRiskLevelColor(item.riskLevel)}>
												{getRiskLevelLabel(item.riskLevel)}
											</Tag>
										</Descriptions.Item>
										<Descriptions.Item label="理由码" span={1}>
											{item.reasonCode}
										</Descriptions.Item>
										<Descriptions.Item label="创建时间" span={2}>
											{new Date(item.createdAt).toLocaleString()}
										</Descriptions.Item>
									</Descriptions>
								</div>

								{item.reason && (
									<div>
										<Title level={4}>详细说明</Title>
										<Card className="bg-gray-50">
											<MarkdownRenderer content={item.reason} />
										</Card>
									</div>
								)}
							</div>
						</Card>
					</Col>

					<Col xs={24} lg={8}>
						{/* 游客模式提示 */}
						{isGuest && (
							<Alert
								type="info"
								showIcon={true}
								icon={<InfoCircleOutlined />}
								message="游客模式说明"
								description={
									<div className="text-sm">
										<p>• 您正在以游客身份查看失信记录</p>
										<p>• 敏感信息已自动脱敏处理</p>
										<p>• 注册后可查看完整信息</p>
									</div>
								}
								className="mb-4"
							/>
						)}

						<Card title="免责声明" className="mb-4">
							<div className="text-sm text-gray-600 space-y-2">
								<p>• 本信息仅供参考，不构成法律建议</p>
								<p>• 请在使用前验证信息的准确性</p>
								<p>• 如有异议，请联系相关管理员</p>
								<p>• 信息已按隐私保护要求进行脱敏处理</p>
							</div>
						</Card>

						{/* 升级提示 */}
						{isGuest && (
							<Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
								<div className="text-center py-4">
									<div className="text-2xl mb-2">🚀</div>
									<Title level={5} className="!mb-2">
										想要查看完整信息？
									</Title>
									<Text className="text-gray-600 text-sm mb-4 block">
										注册后可查看未脱敏的详细信息和更多功能
									</Text>
									<Space>
										<Button
											type="primary"
											size="small"
											onClick={() => setShowRegistrationGuide(true)}
										>
											立即注册
										</Button>
										<Button size="small" onClick={() => router.push("/login")}>
											已有账户
										</Button>
									</Space>
								</div>
							</Card>
						)}
					</Col>
				</Row>
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
