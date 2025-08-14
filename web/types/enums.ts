/**
 * @fileoverview 系统枚举和状态统一管理
 *
 * @description
 * 本文件统一管理项目中所有的枚举类型、状态定义和相关的工具函数。
 * 使用枚举来确保类型安全和代码一致性。
 *
 * @author BlacklistHub Team
 * @since 1.0.0
 */

// ================================
// 用户相关枚举
// ================================

/**
 * 用户角色枚举
 */
export enum UserRole {
	GUEST = "guest",
	REPORTER = "reporter",
	REVIEWER = "reviewer",
	ADMIN = "admin",
	SUPER_ADMIN = "super_admin",
}

/**
 * 用户角色显示标签映射（中文）
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
	[UserRole.GUEST]: "游客",
	[UserRole.REPORTER]: "举报者",
	[UserRole.REVIEWER]: "审核员",
	[UserRole.ADMIN]: "管理员",
	[UserRole.SUPER_ADMIN]: "超级管理员",
} as const;

/**
 * 用户角色选项（用于表单组件）
 */
export const USER_ROLE_OPTIONS = Object.values(UserRole).map((role) => ({
	label: USER_ROLE_LABELS[role],
	value: role,
}));

// ================================
// 黑名单相关枚举
// ================================

/**
 * 失信主体类型枚举
 */
export enum BlacklistType {
	PERSON = "person",
	COMPANY = "company",
	ORGANIZATION = "organization",
	OTHER = "other",
}

/**
 * 失信主体类型显示标签映射（中文）
 */
export const BLACKLIST_TYPE_LABELS: Record<BlacklistType, string> = {
	[BlacklistType.PERSON]: "个人",
	[BlacklistType.COMPANY]: "企业",
	[BlacklistType.ORGANIZATION]: "组织",
	[BlacklistType.OTHER]: "其他类型",
} as const;

/**
 * 黑名单类型选项（用于表单组件）
 */
export const BLACKLIST_TYPE_OPTIONS = Object.values(BlacklistType).map(
	(type) => ({
		label: BLACKLIST_TYPE_LABELS[type],
		value: type,
	}),
);

/**
 * 风险等级枚举
 */
export enum RiskLevel {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
}

/**
 * 风险等级显示标签映射（中文）
 */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
	[RiskLevel.LOW]: "低风险",
	[RiskLevel.MEDIUM]: "中风险",
	[RiskLevel.HIGH]: "高风险",
} as const;

/**
 * 风险等级颜色映射（用于Tag组件）
 */
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
	[RiskLevel.LOW]: "success",
	[RiskLevel.MEDIUM]: "warning",
	[RiskLevel.HIGH]: "error",
} as const;

/**
 * 风险等级选项（用于表单组件）
 */
export const RISK_LEVEL_OPTIONS = Object.values(RiskLevel).map((level) => ({
	label: RISK_LEVEL_LABELS[level],
	value: level,
}));

/**
 * 黑名单状态枚举
 */
export enum BlacklistStatus {
	DRAFT = "draft",
	PENDING = "pending",
	PUBLISHED = "published",
	REJECTED = "rejected",
	RETRACTED = "retracted",
}

/**
 * 黑名单状态显示标签映射（中文）
 */
export const BLACKLIST_STATUS_LABELS: Record<BlacklistStatus, string> = {
	[BlacklistStatus.DRAFT]: "草稿状态",
	[BlacklistStatus.PENDING]: "待审核",
	[BlacklistStatus.PUBLISHED]: "已发布",
	[BlacklistStatus.REJECTED]: "已拒绝",
	[BlacklistStatus.RETRACTED]: "已撤回",
} as const;

/**
 * 黑名单状态颜色映射（用于Tag组件）
 */
export const BLACKLIST_STATUS_COLORS: Record<BlacklistStatus, string> = {
	[BlacklistStatus.DRAFT]: "default",
	[BlacklistStatus.PENDING]: "processing",
	[BlacklistStatus.PUBLISHED]: "success",
	[BlacklistStatus.REJECTED]: "error",
	[BlacklistStatus.RETRACTED]: "warning",
} as const;

/**
 * 黑名单状态选项（用于表单组件）
 */
export const BLACKLIST_STATUS_OPTIONS = Object.values(BlacklistStatus).map(
	(status) => ({
		label: BLACKLIST_STATUS_LABELS[status],
		value: status,
	}),
);

// ================================
// 工具函数
// ================================

/**
 * 获取用户角色显示标签
 */
export function getUserRoleLabel(role: UserRole | string): string {
	return USER_ROLE_LABELS[role as UserRole] || role;
}

/**
 * 获取黑名单类型显示标签
 */
export function getBlacklistTypeLabel(type: BlacklistType | string): string {
	return BLACKLIST_TYPE_LABELS[type as BlacklistType] || type;
}

/**
 * 获取风险等级显示标签
 */
export function getRiskLevelLabel(level: RiskLevel | string): string {
	return RISK_LEVEL_LABELS[level as RiskLevel] || level;
}

/**
 * 获取风险等级颜色
 */
export function getRiskLevelColor(level: RiskLevel | string): string {
	return RISK_LEVEL_COLORS[level as RiskLevel] || "default";
}

/**
 * 获取黑名单状态显示标签
 */
export function getBlacklistStatusLabel(
	status: BlacklistStatus | string,
): string {
	return BLACKLIST_STATUS_LABELS[status as BlacklistStatus] || status;
}

/**
 * 获取黑名单状态颜色
 */
export function getBlacklistStatusColor(
	status: BlacklistStatus | string,
): string {
	return BLACKLIST_STATUS_COLORS[status as BlacklistStatus] || "default";
}

/**
 * 获取来源类型显示标签
 */
export function getSourceTypeLabel(sourceType: SourceType | string): string {
	return SOURCE_TYPE_LABELS[sourceType as SourceType] || sourceType;
}

/**
 * 获取理由码显示标签
 */
export function getReasonCodeLabel(reasonCode: ReasonCode | string): string {
	return REASON_CODE_LABELS[reasonCode as ReasonCode] || reasonCode;
}

// ================================
// 来源类型枚举
// ================================

/**
 * 来源类型枚举
 */
export enum SourceType {
	USER_REPORT = "user_report",
	SYSTEM_DETECTION = "system_detection",
	MANUAL_REVIEW = "manual_review",
	EXTERNAL_DATA = "external_data",
	PARTNER = "partner",
	REGULATORY = "regulatory",
	OTHER = "other",
}

/**
 * 来源类型显示标签映射（中文）
 */
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
	[SourceType.USER_REPORT]: "用户举报",
	[SourceType.SYSTEM_DETECTION]: "系统检测",
	[SourceType.MANUAL_REVIEW]: "人工审核",
	[SourceType.EXTERNAL_DATA]: "外部数据",
	[SourceType.PARTNER]: "合作伙伴",
	[SourceType.REGULATORY]: "监管机构",
	[SourceType.OTHER]: "其他来源",
} as const;

/**
 * 来源类型选项（用于表单组件）
 */
export const SOURCE_TYPE_OPTIONS = Object.values(SourceType).map((source) => ({
	label: SOURCE_TYPE_LABELS[source],
	value: source,
}));

// ================================
// 理由码枚举
// ================================

/**
 * 理由码枚举
 */
export enum ReasonCode {
	// 欺诈类
	FRAUD_PAYMENT = "fraud.payment",
	FRAUD_CHARGEBACK = "fraud.chargeback",
	FRAUD_IDENTITY = "fraud.identity",
	FRAUD_ACCOUNT = "fraud.account",

	// 滥用类
	ABUSE_SPAM = "abuse.spam",
	ABUSE_HARASSMENT = "abuse.harassment",
	ABUSE_PHISHING = "abuse.phishing",
	ABUSE_MALWARE = "abuse.malware",

	// 违规类
	VIOLATION_TERMS = "violation.terms",
	VIOLATION_POLICY = "violation.policy",
	VIOLATION_LEGAL = "violation.legal",

	// 安全类
	SECURITY_BREACH = "security.breach",
	SECURITY_SUSPICIOUS = "security.suspicious",

	// 质量类
	QUALITY_FAKE = "quality.fake",
	QUALITY_DUPLICATE = "quality.duplicate",

	// 其他类
	OTHER_MANUAL = "other.manual",
	OTHER_SYSTEM = "other.system",
}

/**
 * 理由码显示标签映射（中文）
 */
export const REASON_CODE_LABELS: Record<ReasonCode, string> = {
	[ReasonCode.FRAUD_PAYMENT]: "欺诈 - 支付欺诈",
	[ReasonCode.FRAUD_CHARGEBACK]: "欺诈 - 拒付欺诈",
	[ReasonCode.FRAUD_IDENTITY]: "欺诈 - 身份欺诈",
	[ReasonCode.FRAUD_ACCOUNT]: "欺诈 - 账户欺诈",
	[ReasonCode.ABUSE_SPAM]: "滥用 - 垃圾信息",
	[ReasonCode.ABUSE_HARASSMENT]: "滥用 - 骚扰行为",
	[ReasonCode.ABUSE_PHISHING]: "滥用 - 钓鱼攻击",
	[ReasonCode.ABUSE_MALWARE]: "滥用 - 恶意软件",
	[ReasonCode.VIOLATION_TERMS]: "违规 - 违反条款",
	[ReasonCode.VIOLATION_POLICY]: "违规 - 违反政策",
	[ReasonCode.VIOLATION_LEGAL]: "违规 - 法律违规",
	[ReasonCode.SECURITY_BREACH]: "安全 - 数据泄露",
	[ReasonCode.SECURITY_SUSPICIOUS]: "安全 - 可疑活动",
	[ReasonCode.QUALITY_FAKE]: "质量 - 虚假信息",
	[ReasonCode.QUALITY_DUPLICATE]: "质量 - 重复内容",
	[ReasonCode.OTHER_MANUAL]: "其他 - 人工标记",
	[ReasonCode.OTHER_SYSTEM]: "其他 - 系统标记",
} as const;

/**
 * 理由码选项（用于表单组件）
 */
export const REASON_CODE_OPTIONS = Object.values(ReasonCode).map((code) => ({
	label: REASON_CODE_LABELS[code],
	value: code,
}));

// ================================
// 权限相关枚举
// ================================

/**
 * 权限操作枚举
 */
export enum Permission {
	// 游客专用权限
	VIEW_PUBLIC_BLACKLIST = "view_public_blacklist",
	SEARCH_PUBLIC_DATA = "search_public_data",
	VIEW_PUBLIC_STATS = "view_public_stats",
	VIEW_HELP_DOCS = "view_help_docs",

	// 用户管理权限
	VIEW_USERS = "view_users",
	CREATE_USERS = "create_users",
	EDIT_USERS = "edit_users",
	DELETE_USERS = "delete_users",

	// 黑名单管理权限
	VIEW_BLACKLIST = "view_blacklist",
	CREATE_BLACKLIST = "create_blacklist",
	EDIT_BLACKLIST = "edit_blacklist",
	DELETE_BLACKLIST = "delete_blacklist",
	REVIEW_BLACKLIST = "review_blacklist",
	PUBLISH_BLACKLIST = "publish_blacklist",

	// 系统管理权限
	MANAGE_ENUMS = "manage_enums",
	VIEW_SYSTEM_LOGS = "view_system_logs",
	MANAGE_SYSTEM = "manage_system",
}

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	[UserRole.GUEST]: [
		Permission.VIEW_PUBLIC_BLACKLIST,
		Permission.SEARCH_PUBLIC_DATA,
		Permission.VIEW_PUBLIC_STATS,
		Permission.VIEW_HELP_DOCS,
	],
	[UserRole.REPORTER]: [
		Permission.VIEW_BLACKLIST,
		Permission.CREATE_BLACKLIST,
		Permission.EDIT_BLACKLIST, // 仅限自己创建的
	],
	[UserRole.REVIEWER]: [
		Permission.VIEW_BLACKLIST,
		Permission.CREATE_BLACKLIST,
		Permission.EDIT_BLACKLIST,
		Permission.REVIEW_BLACKLIST,
		Permission.PUBLISH_BLACKLIST,
	],
	[UserRole.ADMIN]: [
		Permission.VIEW_USERS,
		Permission.CREATE_USERS,
		Permission.EDIT_USERS,
		Permission.DELETE_USERS,
		Permission.VIEW_BLACKLIST,
		Permission.CREATE_BLACKLIST,
		Permission.EDIT_BLACKLIST,
		Permission.DELETE_BLACKLIST,
		Permission.REVIEW_BLACKLIST,
		Permission.PUBLISH_BLACKLIST,
		Permission.MANAGE_ENUMS,
		Permission.VIEW_SYSTEM_LOGS,
	],
	[UserRole.SUPER_ADMIN]: Object.values(Permission), // 拥有所有权限
} as const;

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(
	userRole: UserRole | string,
	permission: Permission,
): boolean {
	const role = userRole as UserRole;
	return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * 检查用户是否可以编辑指定的黑名单条目
 */
export function canEditBlacklistItem(
	userRole: UserRole | string,
	itemOperator: string,
	currentUsername: string,
): boolean {
	const role = userRole as UserRole;

	// 高权限用户可以编辑任何条目
	if (
		[UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role)
	) {
		return true;
	}

	// Reporter只能编辑自己创建的条目
	if (role === UserRole.REPORTER) {
		return itemOperator === currentUsername;
	}

	return false;
}
