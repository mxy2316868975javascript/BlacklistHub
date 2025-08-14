"use client";
import {
	CheckCircleOutlined,
	CloseOutlined,
	EditOutlined,
	EyeOutlined,
	GiftOutlined,
	InfoCircleOutlined,
	LoginOutlined,
	PlusOutlined,
	SafetyCertificateOutlined,
	SearchOutlined,
	UserAddOutlined,
} from "@ant-design/icons";
import { Button, Card, Modal, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type RegistrationTrigger =
	| "limitation"
	| "feature"
	| "time"
	| "exit_intent";

interface RegistrationGuideProps {
	open: boolean;
	trigger: RegistrationTrigger;
	onRegister: () => void;
	onLogin: () => void;
	onDismiss: () => void;
	customBenefits?: string[];
	showComparison?: boolean;
	autoClose?: boolean;
}

export default function RegistrationGuide({
	open,
	trigger,
	onRegister,
	onLogin,
	onDismiss,
	customBenefits,
	showComparison = true,
	autoClose = false,
}: RegistrationGuideProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	// 根据触发方式获取配置
	const getTriggerConfig = () => {
		switch (trigger) {
			case "limitation":
				return {
					title: "🚀 解锁更多功能",
					subtitle: "您已达到游客模式的使用限制",
					urgency: "high",
					primaryAction: "立即注册",
					benefits: [
						"无限制搜索和查看",
						"创建和管理黑名单",
						"查看完整详细信息",
						"参与社区贡献",
						"获得专业支持",
					],
				};
			case "feature":
				return {
					title: "🔓 功能需要注册",
					subtitle: "此功能仅对注册用户开放",
					urgency: "medium",
					primaryAction: "注册解锁",
					benefits: [
						"创建和编辑黑名单",
						"高级搜索和筛选",
						"数据导出功能",
						"API访问权限",
						"优先技术支持",
					],
				};
			case "time":
				return {
					title: "💡 体验如何？",
					subtitle: "看起来您对我们的平台很感兴趣",
					urgency: "low",
					primaryAction: "加入我们",
					benefits: [
						"保存您的查询历史",
						"个性化推荐内容",
						"参与平台建设",
						"获得最新失信资讯",
						"享受会员专属功能",
					],
				};
			case "exit_intent":
				return {
					title: "⏰ 等等！",
					subtitle: "注册只需30秒，解锁全部功能",
					urgency: "high",
					primaryAction: "快速注册",
					benefits: [
						"完全免费注册",
						"立即解锁所有功能",
						"无广告干扰",
						"专业数据支持",
						"7x24小时服务",
					],
				};
		}
	};

	const config = getTriggerConfig();
	const benefits = customBenefits || config.benefits;

	const handleRegister = async () => {
		setLoading(true);
		try {
			onRegister();
			router.push("/register");
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = () => {
		onLogin();
		router.push("/login");
	};

	return (
		<Modal
			title={null}
			open={open}
			footer={null}
			onCancel={onDismiss}
			centered={true}
			width={600}
			className="registration-guide-modal"
			closeIcon={
				<CloseOutlined className="text-gray-400 hover:text-gray-600" />
			}
		>
			<div className="p-6">
				{/* 头部 */}
				<div className="text-center mb-6">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
						<SafetyCertificateOutlined className="text-2xl text-white" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{config.title}
					</h2>
					<p className="text-gray-600">{config.subtitle}</p>
				</div>

				{/* 功能对比 */}
				{showComparison && (
					<div className="grid grid-cols-2 gap-4 mb-6">
						{/* 游客模式 */}
						<Card size="small" className="text-center">
							<div className="mb-3">
								<Tag color="orange" className="mb-2">
									当前：游客模式
								</Tag>
							</div>
							<div className="space-y-2 text-sm text-gray-600">
								<div className="flex items-center gap-2">
									<SearchOutlined />
									<span>每日查询 10 次</span>
								</div>
								<div className="flex items-center gap-2">
									<EyeOutlined />
									<span>基础信息查看</span>
								</div>
								<div className="flex items-center gap-2 text-gray-400">
									<PlusOutlined />
									<span>无法举报失信</span>
								</div>
								<div className="flex items-center gap-2 text-gray-400">
									<EditOutlined />
									<span>无法管理记录</span>
								</div>
							</div>
						</Card>

						{/* 注册用户 */}
						<Card
							size="small"
							className="text-center border-2 border-blue-200 bg-blue-50"
						>
							<div className="mb-3">
								<Tag color="blue" className="mb-2">
									升级：注册用户
								</Tag>
							</div>
							<div className="space-y-2 text-sm text-blue-700">
								<div className="flex items-center gap-2">
									<CheckCircleOutlined />
									<span>无限制查询</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircleOutlined />
									<span>完整信息查看</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircleOutlined />
									<span>举报失信行为</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircleOutlined />
									<span>管理失信记录</span>
								</div>
							</div>
						</Card>
					</div>
				)}

				{/* 注册优势 */}
				<div className="mb-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
						<GiftOutlined className="text-blue-500" />
						注册后您将获得
					</h3>
					<div className="grid grid-cols-1 gap-2">
						{benefits.map((benefit, index) => (
							<div
								key={`benefit-${benefit.slice(0, 10)}-${index}`}
								className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
							>
								<CheckCircleOutlined className="text-green-500 flex-shrink-0" />
								<span className="text-gray-700">{benefit}</span>
							</div>
						))}
					</div>
				</div>

				{/* 操作按钮 */}
				<div className="space-y-3">
					<Button
						type="primary"
						size="large"
						icon={<UserAddOutlined />}
						loading={loading}
						onClick={handleRegister}
						className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 border-none shadow-lg hover:shadow-xl transition-all duration-300"
					>
						{config.primaryAction}
					</Button>

					<div className="flex items-center gap-3">
						<Button
							size="large"
							icon={<LoginOutlined />}
							onClick={handleLogin}
							className="flex-1"
						>
							已有账户，直接登录
						</Button>

						{autoClose && (
							<Button size="large" onClick={onDismiss} className="px-6">
								稍后提醒
							</Button>
						)}
					</div>
				</div>

				{/* 底部说明 */}
				<div className="mt-6 pt-4 border-t border-gray-100">
					<div className="flex items-center justify-center gap-2 text-xs text-gray-500">
						<InfoCircleOutlined />
						<span>注册完全免费，我们承诺保护您的隐私安全</span>
					</div>
				</div>
			</div>
		</Modal>
	);
}

// 预设的引导组件
export const LimitationGuide = (
	props: Omit<RegistrationGuideProps, "trigger">,
) => <RegistrationGuide trigger="limitation" {...props} />;

export const FeatureGuide = (
	props: Omit<RegistrationGuideProps, "trigger">,
) => <RegistrationGuide trigger="feature" {...props} />;

export const TimeBasedGuide = (
	props: Omit<RegistrationGuideProps, "trigger">,
) => <RegistrationGuide trigger="time" {...props} />;

export const ExitIntentGuide = (
	props: Omit<RegistrationGuideProps, "trigger">,
) => <RegistrationGuide trigger="exit_intent" {...props} />;

// 命名导出主组件
export { RegistrationGuide };
