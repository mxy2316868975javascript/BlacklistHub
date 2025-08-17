"use client";
import { LineChartOutlined, WarningOutlined, SafetyOutlined, BugOutlined } from "@ant-design/icons";
import { Card, Progress, Tag, Tooltip } from "antd";
import axios from "axios";
import useSwr from "swr";
import { type ReasonCode } from "@/types/blacklist";
import { getReasonCodeLabel } from "@/types/enums";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

interface ReasonCodeStats {
	_id: ReasonCode;
	count: number;
	percentage?: number;
}

export default function ReasonsTicker() {
	const { data, isLoading } = useSwr("/api/rankings", fetcher);
	const reasons: ReasonCodeStats[] = data?.topReasonCodes || [];

	// 计算百分比
	const totalCount = reasons.reduce((sum, reason) => sum + reason.count, 0);
	const reasonsWithPercentage = reasons.map(reason => ({
		...reason,
		percentage: totalCount > 0 ? Math.round((reason.count / totalCount) * 100) : 0
	}));

	// 获取理由码的图标和颜色
	const getReasonCodeIcon = (reasonCode: ReasonCode) => {
		const code = reasonCode.toLowerCase();
		if (code.includes('fraud')) {
			return <WarningOutlined className="text-red-500" />;
		}
		if (code.includes('abuse')) {
			return <SafetyOutlined className="text-orange-500" />;
		}
		if (code.includes('security')) {
			return <BugOutlined className="text-purple-500" />;
		}
		return <LineChartOutlined className="text-blue-500" />;
	};

	// 获取理由码的颜色
	const getReasonCodeColor = (reasonCode: ReasonCode) => {
		const code = reasonCode.toLowerCase();
		if (code.includes('fraud')) return 'red';
		if (code.includes('abuse')) return 'orange';
		if (code.includes('security')) return 'purple';
		if (code.includes('violation')) return 'volcano';
		if (code.includes('quality')) return 'gold';
		return 'blue';
	};

	// 获取理由码的简短描述
	const getReasonCodeDescription = (reasonCode: ReasonCode) => {
		const descriptions: Record<string, string> = {
			'fraud.payment': '涉及支付欺诈行为，包括虚假交易、盗刷等',
			'fraud.chargeback': '恶意拒付，损害商家利益',
			'fraud.identity': '身份信息造假，冒用他人身份',
			'fraud.account': '账户异常操作，疑似被盗用',
			'abuse.spam': '发送垃圾信息，影响用户体验',
			'abuse.harassment': '骚扰他人，违反社区规范',
			'abuse.phishing': '钓鱼攻击，窃取用户信息',
			'abuse.malware': '传播恶意软件，威胁系统安全',
			'violation.terms': '违反平台使用条款',
			'violation.policy': '违反相关政策规定',
			'violation.legal': '涉及违法违规行为',
			'security.breach': '存在安全漏洞风险',
			'security.suspicious': '行为异常，存在安全隐患',
			'quality.fake': '提供虚假信息，误导用户',
			'quality.duplicate': '重复内容，影响信息质量',
			'other.manual': '人工审核标记的问题',
			'other.system': '系统自动检测的异常',
		};
		return descriptions[reasonCode] || '其他类型的失信行为';
	};

	if (isLoading) {
		return (
			<Card size="small" loading={true}>
				<div className="h-32" />
			</Card>
		);
	}

	if (reasons.length === 0) {
		return (
			<Card size="small">
				<div className="text-center py-4 text-gray-500">
					<LineChartOutlined className="text-2xl mb-2" />
					<div className="text-sm">暂无数据</div>
				</div>
			</Card>
		);
	}

	return (
		<>
			<Card
				size="small"
				title={
					<div className="flex items-center gap-2">
						<LineChartOutlined className="text-blue-500" />
						<span className="text-sm font-medium">热门失信类型</span>
						<Tag color="blue">{reasons.length}</Tag>
					</div>
				}
				className="shadow-sm"
			>
				{/* 滚动容器 */}
				<div className="h-40 overflow-hidden relative group">
					<div className="space-y-3 pb-3 animate-scroll-reasons group-hover:pause-animation">
					{/* 渲染两倍的内容以实现无缝循环 */}
					{[...reasonsWithPercentage, ...reasonsWithPercentage].map((reason, index) => {
						const displayIndex = (index % reasonsWithPercentage.length) + 1;
						return (
							<div key={`${reason._id}-${index}`} className="group">
								<div className="flex items-center justify-between mb-1">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<span className="text-xs text-gray-400 font-mono w-4 text-center">
											{displayIndex}
										</span>
										{getReasonCodeIcon(reason._id)}
										<Tooltip
											title={getReasonCodeDescription(reason._id)}
											placement="topLeft"
										>
											<span className="text-xs font-medium truncate cursor-help">
												{getReasonCodeLabel(reason._id)}
											</span>
										</Tooltip>
									</div>
									<div className="flex items-center gap-2 flex-shrink-0">
										<Tag
											color={getReasonCodeColor(reason._id)}
											className="text-xs font-mono"
										>
											{reason.count}
										</Tag>
										<span className="text-xs text-gray-500 font-mono w-8 text-right">
											{reason.percentage}%
										</span>
									</div>
								</div>
								<Progress
									percent={reason.percentage}
									size="small"
									showInfo={false}
									strokeColor={{
										'0%': getReasonCodeColor(reason._id) === 'red' ? '#ff4d4f' :
											  getReasonCodeColor(reason._id) === 'orange' ? '#ff7a00' :
											  getReasonCodeColor(reason._id) === 'purple' ? '#722ed1' :
											  getReasonCodeColor(reason._id) === 'volcano' ? '#fa541c' :
											  getReasonCodeColor(reason._id) === 'gold' ? '#faad14' : '#1890ff',
										'100%': getReasonCodeColor(reason._id) === 'red' ? '#ff7875' :
												getReasonCodeColor(reason._id) === 'orange' ? '#ffa940' :
												getReasonCodeColor(reason._id) === 'purple' ? '#9254de' :
												getReasonCodeColor(reason._id) === 'volcano' ? '#ff7a45' :
												getReasonCodeColor(reason._id) === 'gold' ? '#ffc53d' : '#40a9ff',
									}}
									className="group-hover:opacity-80 transition-opacity"
								/>
							</div>
						);
					})}
				</div>

				{/* 渐变遮罩 */}
				<div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
				<div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
			</div>

			{/* 底部统计信息 */}
			{reasons.length > 0 && (
				<div className="text-center pt-2 border-t border-gray-100 mt-2">
					<span className="text-xs text-gray-400">
						共 {reasons.length} 种失信类型，总计 {reasonsWithPercentage.reduce((sum, r) => sum + r.count, 0)} 条记录
					</span>
				</div>
			)}
			</Card>

			<style jsx>{`
				@keyframes scroll-up {
					0% {
						transform: translateY(0);
					}
					100% {
						transform: translateY(-50%);
					}
				}

				.animate-scroll-reasons {
					animation: scroll-up ${reasonsWithPercentage.length * 3}s linear infinite;
				}

				.group:hover .animate-scroll-reasons {
					animation-play-state: paused;
				}
			`}</style>
		</>
	);
}
