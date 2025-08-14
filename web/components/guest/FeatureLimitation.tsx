"use client";
import {
	CloseOutlined,
	EditOutlined,
	EyeOutlined,
	LockOutlined,
	PlusOutlined,
	RocketOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Progress, Space, Tag } from "antd";
import { useState } from "react";

export type LimitationType = "search" | "view" | "create" | "edit" | "general";

interface FeatureLimitationProps {
	type: LimitationType;
	remaining?: number;
	total?: number;
	title?: string;
	description?: string;
	onUpgrade: () => void;
	onDismiss?: () => void;
	showProgress?: boolean;
	severity?: "info" | "warning" | "error";
	className?: string;
}

export default function FeatureLimitation({
	type,
	remaining = 0,
	total = 0,
	title,
	description,
	onUpgrade,
	onDismiss,
	showProgress = true,
	severity = "info",
	className = "",
}: FeatureLimitationProps) {
	const [dismissed, setDismissed] = useState(false);

	if (dismissed) {
		return null;
	}

	const handleDismiss = () => {
		setDismissed(true);
		onDismiss?.();
	};

	// 根据类型获取配置
	const getTypeConfig = () => {
		switch (type) {
			case "search":
				return {
					icon: <SearchOutlined />,
					defaultTitle: "查询次数限制",
					defaultDescription: `今日查询次数：${total - remaining}/${total}`,
					color: "blue",
					upgradeText: "注册后无限制查询",
				};
			case "view":
				return {
					icon: <EyeOutlined />,
					defaultTitle: "查看次数限制",
					defaultDescription: `今日查看次数：${total - remaining}/${total}`,
					color: "green",
					upgradeText: "注册后无限制查看",
				};
			case "create":
				return {
					icon: <PlusOutlined />,
					defaultTitle: "举报功能受限",
					defaultDescription: "举报失信行为需要注册账户",
					color: "orange",
					upgradeText: "注册后立即举报",
				};
			case "edit":
				return {
					icon: <EditOutlined />,
					defaultTitle: "管理功能受限",
					defaultDescription: "管理失信记录需要注册账户",
					color: "purple",
					upgradeText: "注册后管理记录",
				};
			default:
				return {
					icon: <LockOutlined />,
					defaultTitle: "功能受限",
					defaultDescription: "此功能需要注册账户",
					color: "gray",
					upgradeText: "立即注册解锁",
				};
		}
	};

	const config = getTypeConfig();
	const displayTitle = title || config.defaultTitle;
	const displayDescription = description || config.defaultDescription;

	// 计算进度百分比
	const progressPercent = total > 0 ? ((total - remaining) / total) * 100 : 0;

	// 根据剩余量确定严重程度
	const getSeverity = () => {
		if (type === "create" || type === "edit") return "warning";
		if (remaining === 0) return "error";
		if (remaining <= total * 0.2) return "warning";
		return "info";
	};

	const alertType = severity === "info" ? getSeverity() : severity;

	// 横幅样式的限制提示
	const renderBanner = () => (
		<Alert
			type={alertType}
			showIcon={true}
			icon={config.icon}
			message={
				<div className="flex items-center justify-between w-full">
					<div className="flex-1">
						<div className="font-medium">{displayTitle}</div>
						<div className="text-sm mt-1">{displayDescription}</div>
						{showProgress && total > 0 && (
							<Progress
								percent={progressPercent}
								size="small"
								strokeColor={
									alertType === "error"
										? "#ff4d4f"
										: alertType === "warning"
											? "#faad14"
											: "#1890ff"
								}
								className="mt-2 max-w-xs"
							/>
						)}
					</div>
					<div className="flex items-center gap-2 ml-4">
						<Button
							type="primary"
							size="small"
							icon={<RocketOutlined />}
							onClick={onUpgrade}
							className="bg-gradient-to-r from-blue-500 to-purple-600 border-none"
						>
							{config.upgradeText}
						</Button>
						{onDismiss && (
							<Button
								type="text"
								size="small"
								icon={<CloseOutlined />}
								onClick={handleDismiss}
								className="text-gray-400 hover:text-gray-600"
							/>
						)}
					</div>
				</div>
			}
			className={`rounded-lg ${className}`}
		/>
	);

	// 卡片样式的限制提示
	const renderCard = () => (
		<Card
			size="small"
			className={`border-l-4 ${
				alertType === "error"
					? "border-l-red-500"
					: alertType === "warning"
						? "border-l-orange-500"
						: "border-l-blue-500"
			} ${className}`}
		>
			<div className="flex items-start gap-3">
				<div
					className={`text-lg ${
						alertType === "error"
							? "text-red-500"
							: alertType === "warning"
								? "text-orange-500"
								: "text-blue-500"
					}`}
				>
					{config.icon}
				</div>
				<div className="flex-1">
					<h4 className="font-medium text-gray-900 mb-1">{displayTitle}</h4>
					<p className="text-sm text-gray-600 mb-3">{displayDescription}</p>

					{showProgress && total > 0 && (
						<div className="mb-3">
							<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
								<span>使用进度</span>
								<span>
									{total - remaining}/{total}
								</span>
							</div>
							<Progress
								percent={progressPercent}
								size="small"
								strokeColor={
									alertType === "error"
										? "#ff4d4f"
										: alertType === "warning"
											? "#faad14"
											: "#1890ff"
								}
							/>
						</div>
					)}

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{remaining > 0 && (
								<Tag color={config.color}>剩余 {remaining} 次</Tag>
							)}
							{remaining === 0 && <Tag color="red">已用完</Tag>}
						</div>
						<Space>
							<Button
								type="primary"
								size="small"
								icon={<RocketOutlined />}
								onClick={onUpgrade}
							>
								{config.upgradeText}
							</Button>
							{onDismiss && (
								<Button
									type="text"
									size="small"
									icon={<CloseOutlined />}
									onClick={handleDismiss}
								/>
							)}
						</Space>
					</div>
				</div>
			</div>
		</Card>
	);

	// 根据类型返回不同样式
	if (type === "create" || type === "edit") {
		return renderCard();
	}

	return renderBanner();
}

// 预设的限制提示组件
export const SearchLimitationBanner = (
	props: Omit<FeatureLimitationProps, "type">,
) => <FeatureLimitation type="search" {...props} />;

export const ViewLimitationBanner = (
	props: Omit<FeatureLimitationProps, "type">,
) => <FeatureLimitation type="view" {...props} />;

export const CreateLimitationCard = (
	props: Omit<FeatureLimitationProps, "type">,
) => <FeatureLimitation type="create" {...props} />;

export const EditLimitationCard = (
	props: Omit<FeatureLimitationProps, "type">,
) => <FeatureLimitation type="edit" {...props} />;

// 智能限制提示组件 - 根据剩余量自动选择样式和严重程度
interface SmartLimitationProps
	extends Omit<FeatureLimitationProps, "severity"> {
	autoSeverity?: boolean;
}

export const SmartLimitation = ({
	autoSeverity = true,
	...props
}: SmartLimitationProps) => {
	let severity: "info" | "warning" | "error" = "info";

	if (autoSeverity && props.total && props.remaining !== undefined) {
		const usagePercent = ((props.total - props.remaining) / props.total) * 100;
		if (props.remaining === 0) {
			severity = "error";
		} else if (usagePercent >= 80) {
			severity = "warning";
		}
	}

	return <FeatureLimitation severity={severity} {...props} />;
};
