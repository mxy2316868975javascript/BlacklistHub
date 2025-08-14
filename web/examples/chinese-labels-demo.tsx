/**
 * @fileoverview 中文标签映射演示
 * 
 * @description
 * 本文件展示如何使用统一的中文标签映射系统。
 * 所有状态都已映射为用户友好的中文显示。
 * 
 * @author BlacklistHub Team
 * @since 1.0.0
 */

import React from 'react';
import { Tag, Card, Space, Descriptions, Select } from 'antd';
import {
	// 枚举类型
	UserRole,
	BlacklistType,
	RiskLevel,
	BlacklistStatus,
	SourceType,
	ReasonCode,
	
	// 中文标签获取函数
	getUserRoleLabel,
	getBlacklistTypeLabel,
	getRiskLevelLabel,
	getRiskLevelColor,
	getBlacklistStatusLabel,
	getBlacklistStatusColor,
	getSourceTypeLabel,
	getReasonCodeLabel,
	
	// 选项常量（用于表单）
	USER_ROLE_OPTIONS,
	BLACKLIST_TYPE_OPTIONS,
	RISK_LEVEL_OPTIONS,
	BLACKLIST_STATUS_OPTIONS,
	SOURCE_TYPE_OPTIONS,
	REASON_CODE_OPTIONS,
} from '@/types/enums';

/**
 * 用户角色展示组件
 */
export function UserRoleDemo() {
	const roles = Object.values(UserRole);
	
	return (
		<Card title="用户角色中文映射" className="mb-4">
			<Space wrap>
				{roles.map(role => (
					<Tag key={role} color="blue">
						{role} → {getUserRoleLabel(role)}
					</Tag>
				))}
			</Space>
			
			<div className="mt-4">
				<h4>表单选择器示例：</h4>
				<Select
					placeholder="请选择用户角色"
					options={USER_ROLE_OPTIONS}
					style={{ width: 200 }}
				/>
			</div>
		</Card>
	);
}

/**
 * 黑名单类型展示组件
 */
export function BlacklistTypeDemo() {
	const types = Object.values(BlacklistType);
	
	return (
		<Card title="黑名单类型中文映射" className="mb-4">
			<Space wrap>
				{types.map(type => (
					<Tag key={type} color="purple">
						{type} → {getBlacklistTypeLabel(type)}
					</Tag>
				))}
			</Space>
			
			<div className="mt-4">
				<h4>表单选择器示例：</h4>
				<Select
					placeholder="请选择黑名单类型"
					options={BLACKLIST_TYPE_OPTIONS}
					style={{ width: 200 }}
				/>
			</div>
		</Card>
	);
}

/**
 * 风险等级展示组件
 */
export function RiskLevelDemo() {
	const levels = Object.values(RiskLevel);
	
	return (
		<Card title="风险等级中文映射" className="mb-4">
			<Space wrap>
				{levels.map(level => (
					<Tag key={level} color={getRiskLevelColor(level)}>
						{level} → {getRiskLevelLabel(level)}
					</Tag>
				))}
			</Space>
			
			<div className="mt-4">
				<h4>表单选择器示例：</h4>
				<Select
					placeholder="请选择风险等级"
					options={RISK_LEVEL_OPTIONS}
					style={{ width: 200 }}
				/>
			</div>
		</Card>
	);
}

/**
 * 黑名单状态展示组件
 */
export function BlacklistStatusDemo() {
	const statuses = Object.values(BlacklistStatus);
	
	return (
		<Card title="黑名单状态中文映射" className="mb-4">
			<Space wrap>
				{statuses.map(status => (
					<Tag key={status} color={getBlacklistStatusColor(status)}>
						{status} → {getBlacklistStatusLabel(status)}
					</Tag>
				))}
			</Space>
			
			<div className="mt-4">
				<h4>表单选择器示例：</h4>
				<Select
					placeholder="请选择状态"
					options={BLACKLIST_STATUS_OPTIONS}
					style={{ width: 200 }}
				/>
			</div>
		</Card>
	);
}

/**
 * 来源类型展示组件
 */
export function SourceTypeDemo() {
	const sources = Object.values(SourceType);
	
	return (
		<Card title="来源类型中文映射" className="mb-4">
			<Space wrap>
				{sources.map(source => (
					<Tag key={source} color="cyan">
						{source} → {getSourceTypeLabel(source)}
					</Tag>
				))}
			</Space>
			
			<div className="mt-4">
				<h4>表单选择器示例：</h4>
				<Select
					placeholder="请选择来源类型"
					options={SOURCE_TYPE_OPTIONS}
					style={{ width: 200 }}
				/>
			</div>
		</Card>
	);
}

/**
 * 理由码展示组件
 */
export function ReasonCodeDemo() {
	const codes = Object.values(ReasonCode);
	
	return (
		<Card title="理由码中文映射" className="mb-4">
			<div className="space-y-2">
				{codes.map(code => (
					<div key={code} className="flex items-center">
						<Tag color="orange" className="min-w-[120px]">
							{code}
						</Tag>
						<span className="ml-2">→ {getReasonCodeLabel(code)}</span>
					</div>
				))}
			</div>
			
			<div className="mt-4">
				<h4>表单选择器示例：</h4>
				<Select
					placeholder="请选择理由码"
					options={REASON_CODE_OPTIONS}
					style={{ width: 300 }}
					showSearch
					filterOption={(input, option) =>
						(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
					}
				/>
			</div>
		</Card>
	);
}

/**
 * 实际使用场景演示
 */
export function PracticalUsageDemo() {
	// 模拟数据
	const mockBlacklistItem = {
		id: "1",
		type: BlacklistType.EMAIL,
		value: "example@spam.com",
		risk_level: RiskLevel.HIGH,
		status: BlacklistStatus.PUBLISHED,
		source: SourceType.USER_REPORT,
		reason_code: ReasonCode.ABUSE_SPAM,
		operator: "admin",
		created_at: "2024-01-15T10:30:00Z"
	};
	
	return (
		<Card title="实际使用场景演示" className="mb-4">
			<Descriptions bordered column={2}>
				<Descriptions.Item label="类型">
					<Tag color="purple">
						{getBlacklistTypeLabel(mockBlacklistItem.type)}
					</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="值">
					{mockBlacklistItem.value}
				</Descriptions.Item>
				<Descriptions.Item label="风险等级">
					<Tag color={getRiskLevelColor(mockBlacklistItem.risk_level)}>
						{getRiskLevelLabel(mockBlacklistItem.risk_level)}
					</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="状态">
					<Tag color={getBlacklistStatusColor(mockBlacklistItem.status)}>
						{getBlacklistStatusLabel(mockBlacklistItem.status)}
					</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="来源">
					<Tag color="cyan">
						{getSourceTypeLabel(mockBlacklistItem.source)}
					</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="理由码">
					<Tag color="orange">
						{getReasonCodeLabel(mockBlacklistItem.reason_code)}
					</Tag>
				</Descriptions.Item>
			</Descriptions>
		</Card>
	);
}

/**
 * 完整演示页面
 */
export default function ChineseLabelsDemo() {
	return (
		<div className="p-6 max-w-6xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">中文标签映射系统演示</h1>
			
			<div className="space-y-6">
				<UserRoleDemo />
				<BlacklistTypeDemo />
				<RiskLevelDemo />
				<BlacklistStatusDemo />
				<SourceTypeDemo />
				<ReasonCodeDemo />
				<PracticalUsageDemo />
			</div>
			
			<Card title="使用说明" className="mt-6">
				<div className="space-y-2 text-sm text-gray-600">
					<p>• 所有枚举值都已映射为用户友好的中文显示</p>
					<p>• 使用统一的工具函数获取中文标签</p>
					<p>• 表单组件可直接使用预定义的选项常量</p>
					<p>• 支持颜色映射，提供更好的视觉体验</p>
					<p>• 类型安全，编译时检查错误</p>
				</div>
			</Card>
		</div>
	);
}
