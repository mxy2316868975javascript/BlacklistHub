/**
 * @fileoverview 枚举系统使用示例
 * 
 * @description
 * 本文件展示如何使用统一的枚举系统进行类型安全的开发。
 * 
 * @author BlacklistHub Team
 * @since 1.0.0
 */

import {
	// 枚举类型
	UserRole,
	BlacklistType,
	RiskLevel,
	BlacklistStatus,
	Permission,
	
	// 选项常量
	USER_ROLE_OPTIONS,
	BLACKLIST_TYPE_OPTIONS,
	RISK_LEVEL_OPTIONS,
	BLACKLIST_STATUS_OPTIONS,
	
	// 工具函数
	getUserRoleLabel,
	getBlacklistTypeLabel,
	getRiskLevelLabel,
	getRiskLevelColor,
	getBlacklistStatusLabel,
	getBlacklistStatusColor,
	
	// 权限检查函数
	hasPermission,
	canEditBlacklistItem,
	ROLE_PERMISSIONS
} from '@/types/enums';

// ================================
// 基本使用示例
// ================================

/**
 * 用户角色使用示例
 */
function userRoleExample() {
	// 类型安全的枚举使用
	const userRole: UserRole = UserRole.REPORTER;
	
	// 获取显示标签
	const roleLabel = getUserRoleLabel(userRole);
	console.log(`用户角色: ${roleLabel}`); // 输出: 用户角色: 举报者
	
	// 在表单中使用选项
	const roleOptions = USER_ROLE_OPTIONS;
	console.log('角色选项:', roleOptions);
	// 输出: [{ label: "举报者", value: "reporter" }, ...]
}

/**
 * 黑名单类型使用示例
 */
function blacklistTypeExample() {
	// 类型安全的枚举使用
	const type: BlacklistType = BlacklistType.EMAIL;
	
	// 获取显示标签
	const typeLabel = getBlacklistTypeLabel(type);
	console.log(`黑名单类型: ${typeLabel}`); // 输出: 黑名单类型: 邮箱
	
	// 在表单中使用选项
	const typeOptions = BLACKLIST_TYPE_OPTIONS;
	console.log('类型选项:', typeOptions);
}

/**
 * 风险等级使用示例
 */
function riskLevelExample() {
	const riskLevel: RiskLevel = RiskLevel.HIGH;
	
	// 获取显示标签和颜色
	const label = getRiskLevelLabel(riskLevel);
	const color = getRiskLevelColor(riskLevel);
	
	console.log(`风险等级: ${label}, 颜色: ${color}`);
	// 输出: 风险等级: 高, 颜色: error
	
	// 在 Antd Tag 组件中使用
	// <Tag color={getRiskLevelColor(riskLevel)}>
	//   {getRiskLevelLabel(riskLevel)}
	// </Tag>
}

/**
 * 黑名单状态使用示例
 */
function blacklistStatusExample() {
	const status: BlacklistStatus = BlacklistStatus.PUBLISHED;
	
	// 获取显示标签和颜色
	const label = getBlacklistStatusLabel(status);
	const color = getBlacklistStatusColor(status);
	
	console.log(`状态: ${label}, 颜色: ${color}`);
	// 输出: 状态: 已发布, 颜色: success
}

// ================================
// 权限检查示例
// ================================

/**
 * 权限检查使用示例
 */
function permissionExample() {
	const userRole: UserRole = UserRole.REPORTER;
	
	// 检查是否有特定权限
	const canCreateBlacklist = hasPermission(userRole, Permission.CREATE_BLACKLIST);
	const canDeleteUsers = hasPermission(userRole, Permission.DELETE_USERS);
	
	console.log(`可以创建黑名单: ${canCreateBlacklist}`); // true
	console.log(`可以删除用户: ${canDeleteUsers}`); // false
	
	// 获取用户的所有权限
	const userPermissions = ROLE_PERMISSIONS[userRole];
	console.log('用户权限:', userPermissions);
}

/**
 * 黑名单编辑权限检查示例
 */
function editPermissionExample() {
	const currentUserRole: UserRole = UserRole.REPORTER;
	const currentUsername = "john_doe";
	const itemOperator = "john_doe"; // 条目创建者
	
	// 检查是否可以编辑
	const canEdit = canEditBlacklistItem(currentUserRole, itemOperator, currentUsername);
	console.log(`可以编辑: ${canEdit}`); // true (因为是自己创建的)
	
	// 如果是其他人创建的条目
	const otherItemOperator = "jane_doe";
	const canEditOther = canEditBlacklistItem(currentUserRole, otherItemOperator, currentUsername);
	console.log(`可以编辑他人条目: ${canEditOther}`); // false (reporter不能编辑他人条目)
}

// ================================
// React 组件中的使用示例
// ================================

/**
 * 在 React 组件中使用枚举的示例
 */
function ReactComponentExample() {
	// 这是一个伪代码示例，展示在实际组件中如何使用
	
	/*
	import { Select, Tag } from 'antd';
	import { 
		USER_ROLE_OPTIONS, 
		getRiskLevelColor, 
		getRiskLevelLabel 
	} from '@/types/enums';
	
	function UserRoleSelect({ value, onChange }) {
		return (
			<Select
				value={value}
				onChange={onChange}
				options={USER_ROLE_OPTIONS}
				placeholder="请选择用户角色"
			/>
		);
	}
	
	function RiskLevelTag({ level }) {
		return (
			<Tag color={getRiskLevelColor(level)}>
				{getRiskLevelLabel(level)}
			</Tag>
		);
	}
	*/
}

// ================================
// 类型守卫示例
// ================================

/**
 * 类型守卫使用示例
 */
function typeGuardExample() {
	// 检查是否为有效的用户角色
	function isValidUserRole(role: string): role is UserRole {
		return Object.values(UserRole).includes(role as UserRole);
	}
	
	// 检查是否为有效的黑名单类型
	function isValidBlacklistType(type: string): type is BlacklistType {
		return Object.values(BlacklistType).includes(type as BlacklistType);
	}
	
	// 使用示例
	const unknownRole = "unknown_role";
	if (isValidUserRole(unknownRole)) {
		// TypeScript 现在知道 unknownRole 是 UserRole 类型
		const label = getUserRoleLabel(unknownRole);
		console.log(label);
	}
}

// ================================
// 枚举比较示例
// ================================

/**
 * 枚举比较使用示例
 */
function enumComparisonExample() {
	const userRole: UserRole = UserRole.ADMIN;
	
	// 类型安全的比较
	if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
		console.log('用户是管理员');
	}
	
	// 检查高权限用户
	const highPrivilegeRoles = [UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
	const isHighPrivilege = highPrivilegeRoles.includes(userRole);
	console.log(`是否为高权限用户: ${isHighPrivilege}`);
}

// 导出示例函数供测试使用
export {
	userRoleExample,
	blacklistTypeExample,
	riskLevelExample,
	blacklistStatusExample,
	permissionExample,
	editPermissionExample,
	typeGuardExample,
	enumComparisonExample
};
