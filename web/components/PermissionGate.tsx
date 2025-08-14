"use client";
import { type ReactNode, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Permission, ROLE_PERMISSIONS, UserRole } from "@/types/enums";
import {
	CreateLimitationCard,
	EditLimitationCard,
} from "./guest/FeatureLimitation";
import { RegistrationGuide } from "./guest/RegistrationGuide";

interface PermissionGateProps {
	permission: Permission;
	fallback?: ReactNode;
	guestFallback?: ReactNode;
	children: ReactNode;
	showUpgradePrompt?: boolean;
	blockingMode?: boolean; // 是否阻塞模式（显示模态框而不是内联提示）
}

/**
 * 权限门控组件
 * 根据用户角色和权限控制内容的显示
 */
export default function PermissionGate({
	permission,
	fallback,
	guestFallback,
	children,
	showUpgradePrompt = true,
	blockingMode = false,
}: PermissionGateProps) {
	const { user, isGuest } = useAuth();
	const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);

	/**
	 * 检查用户是否有指定权限
	 */
	const hasPermission = (
		userRole: UserRole | null,
		requiredPermission: Permission,
	): boolean => {
		if (!userRole) return false;

		const rolePermissions = ROLE_PERMISSIONS[userRole];
		return rolePermissions.includes(requiredPermission);
	};

	/**
	 * 获取用户角色
	 */
	const getUserRole = (): UserRole | null => {
		if (isGuest) return UserRole.GUEST;
		return user?.role || null;
	};

	const userRole = getUserRole();
	const hasRequiredPermission = hasPermission(userRole, permission);

	// 如果有权限，直接显示内容
	if (hasRequiredPermission) {
		return <>{children}</>;
	}

	// 处理升级提示
	const handleUpgradePrompt = () => {
		if (blockingMode) {
			setShowRegistrationGuide(true);
		}
	};

	const handleRegister = () => {
		setShowRegistrationGuide(false);
		// 这里可以添加注册逻辑或跳转
	};

	const handleLogin = () => {
		setShowRegistrationGuide(false);
		// 这里可以添加登录逻辑或跳转
	};

	const handleDismiss = () => {
		setShowRegistrationGuide(false);
	};

	// 游客模式的处理
	if (isGuest) {
		// 如果提供了游客专用的fallback，使用它
		if (guestFallback) {
			return <>{guestFallback}</>;
		}

		// 如果不显示升级提示，返回null
		if (!showUpgradePrompt) {
			return null;
		}

		// 根据权限类型显示不同的限制提示
		const getGuestLimitationComponent = () => {
			switch (permission) {
				case Permission.CREATE_BLACKLIST:
					return (
						<CreateLimitationCard
							onUpgrade={handleUpgradePrompt}
							title="创建功能需要注册"
							description="注册后您可以创建和管理自己的黑名单条目"
						/>
					);

				case Permission.EDIT_BLACKLIST:
					return (
						<EditLimitationCard
							onUpgrade={handleUpgradePrompt}
							title="编辑功能需要注册"
							description="注册后您可以编辑和管理黑名单条目"
						/>
					);

				case Permission.VIEW_BLACKLIST:
					return (
						<CreateLimitationCard
							onUpgrade={handleUpgradePrompt}
							title="完整查看功能需要注册"
							description="注册后您可以查看完整的黑名单详情和历史记录"
						/>
					);

				case Permission.VIEW_USERS:
				case Permission.CREATE_USERS:
				case Permission.EDIT_USERS:
				case Permission.DELETE_USERS:
					return (
						<CreateLimitationCard
							onUpgrade={handleUpgradePrompt}
							title="用户管理功能需要权限"
							description="此功能需要管理员权限，请联系系统管理员"
						/>
					);

				case Permission.MANAGE_SYSTEM:
				case Permission.VIEW_SYSTEM_LOGS:
					return (
						<CreateLimitationCard
							onUpgrade={handleUpgradePrompt}
							title="系统管理功能需要权限"
							description="此功能需要系统管理员权限"
						/>
					);

				default:
					return (
						<CreateLimitationCard
							onUpgrade={handleUpgradePrompt}
							title="功能需要注册"
							description="注册后解锁更多功能"
						/>
					);
			}
		};

		return (
			<>
				{getGuestLimitationComponent()}
				{blockingMode && (
					<RegistrationGuide
						open={showRegistrationGuide}
						trigger="feature"
						onRegister={handleRegister}
						onLogin={handleLogin}
						onDismiss={handleDismiss}
						customBenefits={getPermissionBenefits(permission)}
					/>
				)}
			</>
		);
	}

	// 已登录用户但权限不足
	if (user && !hasRequiredPermission) {
		if (fallback) {
			return <>{fallback}</>;
		}

		// 默认的权限不足提示
		return (
			<CreateLimitationCard
				onUpgrade={() => {}}
				title="权限不足"
				description="您当前的角色无法访问此功能，请联系管理员"
			/>
		);
	}

	// 未登录用户
	if (fallback) {
		return <>{fallback}</>;
	}

	// 默认返回null
	return null;
}

/**
 * 根据权限获取相关的注册优势
 */
function getPermissionBenefits(permission: Permission): string[] {
	switch (permission) {
		case Permission.CREATE_BLACKLIST:
			return [
				"创建和发布黑名单条目",
				"管理您的贡献内容",
				"参与社区建设",
				"获得贡献者认证",
				"享受创作者权益",
			];

		case Permission.EDIT_BLACKLIST:
			return [
				"编辑和更新黑名单",
				"完善条目信息",
				"协作维护数据质量",
				"获得编辑权限",
				"参与内容审核",
			];

		case Permission.VIEW_BLACKLIST:
			return [
				"查看完整黑名单详情",
				"访问历史记录",
				"获得深度分析",
				"下载详细报告",
				"享受专业服务",
			];

		default:
			return [
				"解锁全部功能",
				"享受完整服务",
				"获得专业支持",
				"参与平台建设",
				"保障数据安全",
			];
	}
}

// 便捷的权限检查Hook
export function usePermission(permission: Permission): {
	hasPermission: boolean;
	userRole: UserRole | null;
	isGuest: boolean;
} {
	const { user, isGuest } = useAuth();

	const getUserRole = (): UserRole | null => {
		if (isGuest) return UserRole.GUEST;
		return user?.role || null;
	};

	const userRole = getUserRole();
	const hasRequiredPermission = userRole
		? ROLE_PERMISSIONS[userRole].includes(permission)
		: false;

	return {
		hasPermission: hasRequiredPermission,
		userRole,
		isGuest,
	};
}

// 预设的权限门控组件
export const CreatePermissionGate = ({
	children,
	...props
}: Omit<PermissionGateProps, "permission">) => (
	<PermissionGate permission={Permission.CREATE_BLACKLIST} {...props}>
		{children}
	</PermissionGate>
);

export const EditPermissionGate = ({
	children,
	...props
}: Omit<PermissionGateProps, "permission">) => (
	<PermissionGate permission={Permission.EDIT_BLACKLIST} {...props}>
		{children}
	</PermissionGate>
);

export const ViewPermissionGate = ({
	children,
	...props
}: Omit<PermissionGateProps, "permission">) => (
	<PermissionGate permission={Permission.VIEW_BLACKLIST} {...props}>
		{children}
	</PermissionGate>
);

export const AdminPermissionGate = ({
	children,
	...props
}: Omit<PermissionGateProps, "permission">) => (
	<PermissionGate permission={Permission.MANAGE_SYSTEM} {...props}>
		{children}
	</PermissionGate>
);
