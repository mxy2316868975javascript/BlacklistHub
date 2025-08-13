// 共享的黑名单相关类型定义

export type BlacklistType = "user" | "ip" | "email" | "phone" | "domain";

export type RiskLevel = "low" | "medium" | "high";

export type BlacklistStatus =
	| "draft"
	| "pending"
	| "published"
	| "rejected"
	| "retracted";

export type SourceType =
	| "user_report"
	| "system_detection"
	| "manual_review"
	| "external_data"
	| "partner"
	| "regulatory"
	| "other";

export type ReasonCode =
	| "fraud.payment"
	| "fraud.chargeback"
	| "fraud.identity"
	| "fraud.account"
	| "abuse.spam"
	| "abuse.harassment"
	| "abuse.phishing"
	| "abuse.malware"
	| "violation.terms"
	| "violation.policy"
	| "violation.legal"
	| "security.breach"
	| "security.suspicious"
	| "quality.fake"
	| "quality.duplicate"
	| "other.manual"
	| "other.system";

export interface BlacklistItem {
	_id: string;
	type: BlacklistType;
	value: string;
	reason: string;
	reason_code: ReasonCode;
	risk_level: RiskLevel;
	source?: SourceType;
	sources?: string[];
	status: BlacklistStatus;
	operator: string;
	created_at: string;
	updated_at: string;
	expires_at?: string;
	timeline?: TimelineItem[];
}

export interface TimelineItem {
	action: string;
	by: string;
	at: string;
	note?: string;
}

// 来源类型的显示映射
export const SOURCE_LABELS: Record<SourceType, string> = {
	user_report: "用户举报",
	system_detection: "系统检测",
	manual_review: "人工审核",
	external_data: "外部数据",
	partner: "合作伙伴",
	regulatory: "监管要求",
	other: "其他",
};

// 理由码的显示映射
export const REASON_CODE_LABELS: Record<ReasonCode, string> = {
	"fraud.payment": "欺诈 - 支付欺诈",
	"fraud.chargeback": "欺诈 - 拒付欺诈",
	"fraud.identity": "欺诈 - 身份欺诈",
	"fraud.account": "欺诈 - 账户欺诈",
	"abuse.spam": "滥用 - 垃圾信息",
	"abuse.harassment": "滥用 - 骚扰行为",
	"abuse.phishing": "滥用 - 钓鱼攻击",
	"abuse.malware": "滥用 - 恶意软件",
	"violation.terms": "违规 - 违反条款",
	"violation.policy": "违规 - 违反政策",
	"violation.legal": "违规 - 违反法律",
	"security.breach": "安全 - 安全漏洞",
	"security.suspicious": "安全 - 可疑活动",
	"quality.fake": "质量 - 虚假信息",
	"quality.duplicate": "质量 - 重复内容",
	"other.manual": "其他 - 人工标记",
	"other.system": "其他 - 系统标记",
};

// 来源类型选项（用于Select组件）
export const SOURCE_OPTIONS = Object.entries(SOURCE_LABELS).map(
	([value, label]) => ({
		label,
		value: value as SourceType,
	}),
);

// 理由码选项（用于Select组件）
export const REASON_CODE_OPTIONS = Object.entries(REASON_CODE_LABELS).map(
	([value, label]) => ({
		label,
		value: value as ReasonCode,
	}),
);

// 类型选项
export const TYPE_OPTIONS: Array<{ label: string; value: BlacklistType }> = [
	{ label: "用户", value: "user" },
	{ label: "IP", value: "ip" },
	{ label: "邮箱", value: "email" },
	{ label: "手机号", value: "phone" },
	{ label: "域名", value: "domain" },
];

// 风险等级选项
export const RISK_LEVEL_OPTIONS: Array<{ label: string; value: RiskLevel }> = [
	{ label: "低", value: "low" },
	{ label: "中", value: "medium" },
	{ label: "高", value: "high" },
];

// 状态选项
export const STATUS_OPTIONS: Array<{ label: string; value: BlacklistStatus }> =
	[
		{ label: "草稿", value: "draft" },
		{ label: "待复核", value: "pending" },
		{ label: "已发布", value: "published" },
		{ label: "已退回", value: "rejected" },
		{ label: "已撤销", value: "retracted" },
	];

// 获取来源的显示文本
export function getSourceLabel(source?: SourceType): string {
	if (!source) return "未知";
	return SOURCE_LABELS[source] || "未知";
}

// 获取理由码的显示文本
export function getReasonCodeLabel(reasonCode?: ReasonCode): string {
	if (!reasonCode) return "未知";
	return REASON_CODE_LABELS[reasonCode] || reasonCode;
}
