/**
 * 游客体验增强组件
 * 提供动画、反馈、引导等用户体验优化
 */

"use client";
import {
	ArrowUpOutlined,
	BulbOutlined,
	CustomerServiceOutlined,
	QuestionCircleOutlined,
	RocketOutlined,
} from "@ant-design/icons";
import type { TourProps } from "antd";
import {
	Affix,
	Button,
	FloatButton,
	message,
	notification,
	Tooltip,
	Tour,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";
import { RegistrationGuide } from "./RegistrationGuide";

interface GuestExperienceEnhancerProps {
	showTour?: boolean;
	showFloatingHelp?: boolean;
	showScrollToTop?: boolean;
	enableNotifications?: boolean;
}

export default function GuestExperienceEnhancer({
	showTour = true,
	showFloatingHelp = true,
	showScrollToTop = true,
	enableNotifications = true,
}: GuestExperienceEnhancerProps) {
	const { isGuest } = useAuth();
	const { session, getRemainingCount } = useGuestSession();

	const [tourOpen, setTourOpen] = useState(false);
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);
	const [hasShownWelcome, setHasShownWelcome] = useState(false);
	const [scrollY, setScrollY] = useState(0);

	const tourRefs = useRef<{ [key: string]: HTMLElement | null }>({});

	const remainingSearches = session ? getRemainingCount("search") : 0;
	const remainingViews = session ? getRemainingCount("view") : 0;

	// 监听滚动事件
	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// 显示欢迎消息
	useEffect(() => {
		if (
			!hasShownWelcome &&
			session?.preferences.showTips &&
			enableNotifications
		) {
			const isNewGuest =
				session.limitations.searchCount === 0 &&
				session.limitations.viewCount === 0;

			if (isNewGuest) {
				setTimeout(() => {
					notification.open({
						message: "🎉 欢迎使用BlacklistHub！",
						description:
							"您正在以游客模式体验我们的平台。每日可免费搜索10次，查看50次。",
						duration: 8,
						placement: "topRight",
						btn: (
							<Button
								type="primary"
								size="small"
								onClick={() => setShowRegistrationGuide(true)}
							>
								了解更多
							</Button>
						),
					});
					setHasShownWelcome(true);
				}, 2000);
			}
		}
	}, [hasShownWelcome, session, enableNotifications]);

	// 使用限制提醒
	useEffect(() => {
		if (!enableNotifications) return;

		// 搜索次数警告
		if (remainingSearches === 2) {
			message.warning({
				content: "搜索次数即将用完，注册后可无限制使用！",
				duration: 5,
				key: "search-warning",
			});
		} else if (remainingSearches === 0) {
			message.error({
				content: "今日搜索次数已用完，明日0点重置或立即注册解锁！",
				duration: 8,
				key: "search-limit",
			});
		}

		// 查看次数警告
		if (remainingViews === 10) {
			message.warning({
				content: "查看次数不多了，注册后可无限制查看！",
				duration: 5,
				key: "view-warning",
			});
		} else if (remainingViews === 0) {
			message.error({
				content: "今日查看次数已用完，注册后立即解锁！",
				duration: 8,
				key: "view-limit",
			});
		}
	}, [remainingSearches, remainingViews, enableNotifications]);

	// 如果不是游客模式，不显示增强组件
	if (!isGuest || !session) {
		return null;
	}

	// 新手引导步骤
	const tourSteps: TourProps["steps"] = [
		{
			title: "欢迎来到BlacklistHub！",
			description: "这里是您的失信人员查询平台，让我们快速了解一下主要功能。",
			target: () => tourRefs.current.logo as HTMLElement,
		},
		{
			title: "快速搜索",
			description:
				"在这里输入姓名、身份证号等信息，快速查询失信人员记录。游客每日可免费搜索10次。",
			target: () => tourRefs.current.search as HTMLElement,
		},
		{
			title: "使用统计",
			description: "这里显示您今日的使用情况。接近限制时会有提醒。",
			target: () => tourRefs.current.stats as HTMLElement,
		},
		{
			title: "失信名单浏览",
			description: "点击这里可以浏览最新的公开失信人员名单。",
			target: () => tourRefs.current.blacklist as HTMLElement,
		},
		{
			title: "注册解锁",
			description: "注册后可解锁无限制搜索、完整信息查看和更多高级功能！",
			target: () => tourRefs.current.register as HTMLElement,
		},
	];

	// 开始新手引导
	const startTour = () => {
		setTourOpen(true);
	};

	// 显示帮助
	const showHelp = () => {
		notification.open({
			message: "💡 使用提示",
			description: (
				<div className="space-y-2">
					<p>• 每日可免费搜索 {session.limitations.maxSearchPerDay} 次</p>
					<p>• 每日可免费查看 {session.limitations.maxViewPerDay} 次</p>
					<p>• 注册后解锁所有功能</p>
				</div>
			),
			duration: 10,
			placement: "topRight",
			btn: (
				<Button
					type="primary"
					size="small"
					onClick={() => setShowRegistrationGuide(true)}
				>
					立即注册
				</Button>
			),
		});
	};

	// 显示升级提示
	const showUpgradePrompt = () => {
		setShowRegistrationGuide(true);
	};

	// 滚动到顶部
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<>
			{/* 浮动操作按钮 */}
			{showFloatingHelp && (
				<FloatButton.Group
					trigger="hover"
					type="primary"
					style={{ right: 24, bottom: 24 }}
					icon={<QuestionCircleOutlined />}
					tooltip="帮助和支持"
				>
					{showTour && (
						<FloatButton
							icon={<BulbOutlined />}
							tooltip="新手引导"
							onClick={startTour}
						/>
					)}
					<FloatButton
						icon={<CustomerServiceOutlined />}
						tooltip="使用帮助"
						onClick={showHelp}
					/>
					<FloatButton
						icon={<RocketOutlined />}
						tooltip="升级账户"
						onClick={showUpgradePrompt}
					/>
				</FloatButton.Group>
			)}

			{/* 滚动到顶部按钮 */}
			{showScrollToTop && scrollY > 300 && (
				<Affix style={{ position: "fixed", right: 24, bottom: 120 }}>
					<Tooltip title="回到顶部">
						<Button
							type="primary"
							shape="circle"
							icon={<ArrowUpOutlined />}
							onClick={scrollToTop}
							className="shadow-lg"
						/>
					</Tooltip>
				</Affix>
			)}

			{/* 新手引导 */}
			{showTour && (
				<Tour
					open={tourOpen}
					onClose={() => setTourOpen(false)}
					steps={tourSteps}
					indicatorsRender={(current, total) => (
						<span className="text-blue-600">
							{current + 1} / {total}
						</span>
					)}
				/>
			)}

			{/* 注册引导模态框 */}
			<RegistrationGuide
				open={showRegistrationGuide}
				trigger="feature"
				onRegister={() => {
					setShowRegistrationGuide(false);
					// 这里可以添加注册跳转逻辑
				}}
				onLogin={() => {
					setShowRegistrationGuide(false);
					// 这里可以添加登录跳转逻辑
				}}
				onDismiss={() => setShowRegistrationGuide(false)}
			/>

			{/* 自定义样式 */}
			<style jsx={true} global={true}>{`
				/* 平滑滚动 */
				html {
					scroll-behavior: smooth;
				}

				/* 浮动按钮动画 */
				.ant-float-btn-group .ant-float-btn {
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
				}

				.ant-float-btn-group .ant-float-btn:hover {
					transform: translateY(-2px);
					box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
				}

				/* 通知样式优化 */
				.ant-notification {
					backdrop-filter: blur(8px);
				}

				.ant-notification-notice {
					border-radius: 12px;
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
				}

				/* 消息样式优化 */
				.ant-message {
					backdrop-filter: blur(8px);
				}

				.ant-message-notice {
					border-radius: 8px;
					box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
				}

				/* 引导遮罩优化 */
				.ant-tour-mask {
					backdrop-filter: blur(2px);
				}

				.ant-tour-content {
					border-radius: 12px;
					box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
				}

				/* 动画优化 */
				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.guest-fade-in {
					animation: fadeInUp 0.6s ease-out;
				}

				@keyframes pulse {
					0%, 100% {
						opacity: 1;
					}
					50% {
						opacity: 0.7;
					}
				}

				.guest-pulse {
					animation: pulse 2s infinite;
				}

				/* 响应式优化 */
				@media (max-width: 768px) {
					.ant-float-btn-group {
						right: 16px !important;
						bottom: 16px !important;
					}
					
					.ant-notification {
						margin: 8px;
						width: calc(100vw - 16px);
					}
				}
			`}</style>
		</>
	);
}

// 体验增强工具函数
export const experienceUtils = {
	// 显示成功反馈
	showSuccess: (message: string, description?: string) => {
		notification.success({
			message,
			description,
			duration: 4,
			placement: "topRight",
		});
	},

	// 显示警告反馈
	showWarning: (message: string, description?: string) => {
		notification.warning({
			message,
			description,
			duration: 6,
			placement: "topRight",
		});
	},

	// 显示错误反馈
	showError: (message: string, description?: string) => {
		notification.error({
			message,
			description,
			duration: 8,
			placement: "topRight",
		});
	},

	// 显示加载反馈
	showLoading: (content = "加载中...") => {
		return message.loading({
			content,
			duration: 0, // 不自动关闭
		});
	},

	// 隐藏加载反馈
	hideLoading: (messageKey?: string | (() => void)) => {
		if (typeof messageKey === "function") {
			messageKey();
		} else {
			message.destroy(messageKey);
		}
	},

	// 显示操作确认
	showConfirm: (
		title: string,
		content: string,
		onOk: () => void,
		onCancel?: () => void,
	) => {
		notification.open({
			message: title,
			description: content,
			duration: 0,
			placement: "topRight",
			btn: (
				<div className="space-x-2">
					<Button size="small" onClick={onCancel}>
						取消
					</Button>
					<Button type="primary" size="small" onClick={onOk}>
						确认
					</Button>
				</div>
			),
			onClose: onCancel,
		});
	},

	// 平滑滚动到元素
	scrollToElement: (elementId: string, offset = 0) => {
		const element = document.getElementById(elementId);
		if (element) {
			const top = element.offsetTop - offset;
			window.scrollTo({
				top,
				behavior: "smooth",
			});
		}
	},

	// 复制到剪贴板
	copyToClipboard: async (text: string, successMessage?: string) => {
		try {
			await navigator.clipboard.writeText(text);
			message.success(successMessage || "已复制到剪贴板");
		} catch (error) {
			// 降级方案
			const textArea = document.createElement("textarea");
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			message.success(successMessage || "已复制到剪贴板");
		}
	},

	// 震动反馈（移动端）
	vibrate: (pattern: number | number[] = 100) => {
		if ("vibrate" in navigator) {
			navigator.vibrate(pattern);
		}
	},
};

// 智能提示系统
export const smartPrompts = {
	// 检查是否应该显示升级提示
	shouldShowUpgradePrompt: (
		session: NonNullable<ReturnType<typeof useGuestSession>["session"]>,
	): boolean => {
		const searchUsage =
			session.limitations.searchCount / session.limitations.maxSearchPerDay;
		const viewUsage =
			session.limitations.viewCount / session.limitations.maxViewPerDay;

		// 使用量超过80%时提示
		return searchUsage > 0.8 || viewUsage > 0.8;
	},

	// 检查是否应该显示功能引导
	shouldShowFeatureGuide: (
		session: NonNullable<ReturnType<typeof useGuestSession>["session"]>,
	): boolean => {
		const sessionDuration = Date.now() - session.startTime;
		const fiveMinutes = 5 * 60 * 1000;

		// 使用超过5分钟且有一定使用量时显示
		return (
			sessionDuration > fiveMinutes &&
			(session.limitations.searchCount > 3 ||
				session.limitations.viewCount > 10)
		);
	},

	// 检查是否应该显示退出意图提示
	shouldShowExitIntentPrompt: (
		session: NonNullable<ReturnType<typeof useGuestSession>["session"]>,
	): boolean => {
		const hasUsedFeatures =
			session.limitations.searchCount > 0 || session.limitations.viewCount > 0;
		const hasNotRegistered =
			!session.preferences.dismissedPrompts.includes("exit_intent");

		return hasUsedFeatures && hasNotRegistered;
	},
};

// 动画工具
export const animationUtils = {
	// 淡入动画
	fadeIn: (element: HTMLElement, duration = 300) => {
		element.style.opacity = "0";
		element.style.transition = `opacity ${duration}ms ease-in-out`;

		requestAnimationFrame(() => {
			element.style.opacity = "1";
		});
	},

	// 滑入动画
	slideIn: (
		element: HTMLElement,
		direction: "up" | "down" | "left" | "right" = "up",
		duration = 300,
	) => {
		const transforms = {
			up: "translateY(20px)",
			down: "translateY(-20px)",
			left: "translateX(20px)",
			right: "translateX(-20px)",
		};

		element.style.transform = transforms[direction];
		element.style.opacity = "0";
		element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

		requestAnimationFrame(() => {
			element.style.transform = "translate(0)";
			element.style.opacity = "1";
		});
	},

	// 脉冲动画
	pulse: (element: HTMLElement, duration = 1000) => {
		element.style.animation = `pulse ${duration}ms ease-in-out infinite`;
	},

	// 移除动画
	removeAnimations: (element: HTMLElement) => {
		element.style.animation = "";
		element.style.transition = "";
		element.style.transform = "";
		element.style.opacity = "";
	},
};

// 响应式工具
export const responsiveUtils = {
	// 检查是否为移动设备
	isMobile: (): boolean => {
		return typeof window !== "undefined" && window.innerWidth < 768;
	},

	// 检查是否为平板设备
	isTablet: (): boolean => {
		return (
			typeof window !== "undefined" &&
			window.innerWidth >= 768 &&
			window.innerWidth < 1024
		);
	},

	// 检查是否为桌面设备
	isDesktop: (): boolean => {
		return typeof window !== "undefined" && window.innerWidth >= 1024;
	},

	// 获取设备类型
	getDeviceType: (): "mobile" | "tablet" | "desktop" => {
		if (responsiveUtils.isMobile()) return "mobile";
		if (responsiveUtils.isTablet()) return "tablet";
		return "desktop";
	},
};
