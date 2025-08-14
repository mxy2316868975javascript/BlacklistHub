/**
 * @fileoverview 用户相关类型定义
 *
 * @description
 * 本文件包含黑名单系统中所有用户相关的类型定义和常量。
 *
 * 系统采用三级权限模型：
 * 1. Reporter（举报者）- 提交黑名单举报
 * 2. Reviewer（审核员）- 审核举报内容
 * 3. Admin（管理员）- 系统管理和用户管理
 *
 * 工作流程：Reporter 提交 → Reviewer 审核 → Admin 发布
 *
 * @author BlacklistHub Team
 * @since 1.0.0
 */

// 导入统一的枚举定义
import type { UserRole } from "./enums";

// 重新导出以保持向后兼容
export { USER_ROLE_OPTIONS, UserRole } from "./enums";

/**
 * 用户认证信息类型
 *
 * @description 用于JWT token验证和用户身份识别的基本信息
 *
 * @property uid - 用户唯一标识符，对应数据库中的 _id
 * @property username - 用户名，用于登录和显示
 * @property role - 用户角色，决定用户的权限级别
 *
 * @example
 * ```typescript
 * const userInfo: UserInfo = {
 *   uid: "507f1f77bcf86cd799439011",
 *   username: "john_doe",
 *   role: "reporter"
 * };
 * ```
 */
export type UserInfo = {
	uid: string;
	username: string;
	role: UserRole;
};

/**
 * 完整用户信息类型
 *
 * @description 包含用户完整信息的类型，主要用于用户列表和管理功能
 *
 * @property _id - 数据库中的用户ID，MongoDB ObjectId 字符串格式
 * @property username - 用户名
 * @property role - 用户角色
 * @property stats - 用户统计信息（可选）
 * @property stats.total - 用户总共提交的黑名单条目数量
 * @property stats.published - 用户已发布的黑名单条目数量
 *
 * @example
 * ```typescript
 * const user: User = {
 *   _id: "507f1f77bcf86cd799439011",
 *   username: "john_doe",
 *   role: "reporter",
 *   stats: {
 *     total: 25,
 *     published: 20
 *   }
 * };
 * ```
 */
export type User = {
	_id: string;
	username: string;
	role: UserRole;
	stats?: {
		total: number;
		published: number;
	};
};

// USER_ROLE_OPTIONS 现在从 enums.ts 导入

// 黑名单相关类型定义
export type BlacklistType =
	| "user"
	| "ip"
	| "email"
	| "phone"
	| "company"
	| "domain"
	| "other";

export interface Blacklist {
	_id: string;
	type: BlacklistType;
	value: string;
	company_name?: string;
	reason_code: string;
	reason: string; // 现在支持富文本内容，包含嵌入的图片
	source: string;
	region: string;
	risk_level: "low" | "medium" | "high";
	status: "draft" | "pending" | "published" | "rejected" | "retracted";
	submitter: string;
	reviewer?: string;
	created_at: Date;
	updated_at: Date;
	published_at?: Date;
}

/**
 * 权限检查常量
 *
 * @description 定义各种操作的权限检查函数
 *
 * 核心权限设计：
 * 1. 系统级控制：super_admin 拥有所有系统功能的最高权限
 * 2. 不可删除：其他用户无法删除超级管理员账户
 * 3. 权限管理：super_admin 可以管理所有其他角色的权限
 *
 * @example
 * ```typescript
 * // 检查是否可以删除用户
 * if (PERMISSIONS.CAN_DELETE_USERS(currentUserRole)) {
 *   // 执行删除操作
 * }
 *
 * // 检查是否可以删除管理员
 * if (PERMISSIONS.CAN_DELETE_ADMINS(currentUserRole)) {
 *   // 执行删除管理员操作
 * }
 * ```
 */
export const PERMISSIONS = {
	/**
	 * 是否可以删除普通用户
	 * @param role 当前用户角色
	 * @returns 是否有权限
	 */
	CAN_DELETE_USERS: (role: UserRole): boolean =>
		["admin", "super_admin"].includes(role),

	/**
	 * 是否可以删除管理员用户
	 * @param role 当前用户角色
	 * @returns 是否有权限
	 */
	CAN_DELETE_ADMINS: (role: UserRole): boolean => role === "super_admin",

	/**
	 * 是否可以删除超级管理员（始终返回false，超级管理员不可删除）
	 * @param _role 当前用户角色（未使用，因为超级管理员不可删除）
	 * @returns 始终返回false
	 */
	CAN_DELETE_SUPER_ADMINS: (_role: UserRole): boolean => false,

	/**
	 * 是否可以修改用户角色
	 * @param role 当前用户角色
	 * @returns 是否有权限
	 */
	CAN_CHANGE_USER_ROLES: (role: UserRole): boolean =>
		["admin", "super_admin"].includes(role),

	/**
	 * 是否可以修改管理员角色
	 * @param role 当前用户角色
	 * @returns 是否有权限
	 */
	CAN_CHANGE_ADMIN_ROLES: (role: UserRole): boolean => role === "super_admin",

	/**
	 * 是否可以访问用户管理页面
	 * @param role 当前用户角色
	 * @returns 是否有权限
	 */
	CAN_ACCESS_USER_MANAGEMENT: (role: UserRole): boolean =>
		["admin", "super_admin"].includes(role),

	/**
	 * 检查是否可以删除指定角色的用户
	 * @param currentRole 当前用户角色
	 * @param targetRole 目标用户角色
	 * @returns 是否有权限删除
	 */
	CAN_DELETE_USER_BY_ROLE: (
		currentRole: UserRole,
		targetRole: UserRole,
	): boolean => {
		// 超级管理员不可被删除
		if (targetRole === "super_admin") return false;
		// 只有超级管理员可以删除管理员
		if (targetRole === "admin") return currentRole === "super_admin";
		// 管理员和超级管理员可以删除普通用户
		return ["admin", "super_admin"].includes(currentRole);
	},

	/**
	 * 检查是否可以修改指定角色用户的权限
	 * @param currentRole 当前用户角色
	 * @param targetRole 目标用户角色
	 * @returns 是否有权限修改
	 */
	CAN_CHANGE_USER_ROLE_BY_ROLE: (
		currentRole: UserRole,
		targetRole: UserRole,
	): boolean => {
		// 只有超级管理员可以修改管理员和超级管理员的角色
		if (["admin", "super_admin"].includes(targetRole)) {
			return currentRole === "super_admin";
		}
		// 管理员和超级管理员可以修改普通用户角色
		return ["admin", "super_admin"].includes(currentRole);
	},
} as const;
