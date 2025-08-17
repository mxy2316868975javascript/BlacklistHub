"use client";
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	EyeOutlined,
	HistoryOutlined,
	InfoCircleOutlined,
	SearchOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Divider,
	Input,
	List,
	message,
	Select,
	Space,
	Tag,
	Tooltip,
	Typography,
} from "antd";
import axios from "axios";
import Link from "next/link";
import React from "react";

const { Text, Title } = Typography;
const { Search } = Input;

interface QuickLookupResult {
	hit: boolean;
	type: string;
	value: string;
	risk_level?: "low" | "medium" | "high";
	status?: string;
	sources_count?: number;
	updated_at?: string;
	records?: Array<{
		id: string;
		reason_code: string;
		created_at: string;
		risk_level: string;
	}>;
}

interface SearchSuggestion {
	value: string;
	type: string;
	count: number;
}

export default function EnhancedQuickLookup() {
	const [type, setType] = React.useState<"person" | "company" | "organization">("person");
	const [value, setValue] = React.useState("");
	const [result, setResult] = React.useState<QuickLookupResult | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [searchHistory, setSearchHistory] = React.useState<string[]>([]);
	const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);

	// 加载搜索历史
	React.useEffect(() => {
		const history = localStorage.getItem("quick_lookup_history");
		if (history) {
			setSearchHistory(JSON.parse(history).slice(0, 5));
		}
	}, []);

	// 保存搜索历史
	const saveToHistory = (query: string) => {
		const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
		setSearchHistory(newHistory);
		localStorage.setItem("quick_lookup_history", JSON.stringify(newHistory));
	};

	// 获取搜索建议
	const getSuggestions = async (query: string) => {
		if (query.length < 2) {
			setSuggestions([]);
			return;
		}

		try {
			const response = await axios.get("/api/blacklist/suggestions", {
				params: { q: query, type, limit: 5 }
			});
			setSuggestions(response.data.suggestions || []);
		} catch (error) {
			setSuggestions([]);
		}
	};

	// 执行查询
	const performLookup = async (searchValue?: string) => {
		const queryValue = searchValue || value;
		if (!queryValue.trim()) {
			return message.warning("请输入要查验的信息");
		}

		setLoading(true);
		try {
			// 增强版API调用
			const response = await axios.get("/api/blacklist/enhanced-lookup", {
				params: { type, value: queryValue, detailed: true }
			});
			
			setResult(response.data);
			saveToHistory(queryValue);
			setSuggestions([]);
		} catch (error) {
			message.error("查询失败，请稍后重试");
			console.error("Lookup failed:", error);
		} finally {
			setLoading(false);
		}
	};

	// 渲染风险等级标签
	const renderRiskTag = (level: string) => {
		const config = {
			high: { color: "error", icon: <CloseCircleOutlined />, text: "高风险" },
			medium: { color: "warning", icon: <WarningOutlined />, text: "中风险" },
			low: { color: "success", icon: <CheckCircleOutlined />, text: "低风险" }
		};
		const { color, icon, text } = config[level as keyof typeof config] || config.low;
		
		return (
			<Tag color={color} icon={icon}>
				{text}
			</Tag>
		);
	};

	// 渲染查询结果
	const renderResult = () => {
		if (!result) return null;

		return (
			<Card className="mt-4" size="small">
				<div className="space-y-3">
					{/* 基本结果 */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Text strong>查验结果：</Text>
							<Tag color={result.hit ? "error" : "success"} icon={result.hit ? <CloseCircleOutlined /> : <CheckCircleOutlined />}>
								{result.hit ? "发现失信记录" : "未发现失信记录"}
							</Tag>
						</div>
						{result.hit && result.risk_level && renderRiskTag(result.risk_level)}
					</div>

					{/* 详细信息 */}
					{result.hit && (
						<>
							<Divider className="my-2" />
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<Text type="secondary">数据来源：</Text>
									<Text>{result.sources_count || 0} 个来源</Text>
								</div>
								<div>
									<Text type="secondary">最新状态：</Text>
									<Text>{result.status || "未知"}</Text>
								</div>
								<div>
									<Text type="secondary">更新时间：</Text>
									<Text>
										{result.updated_at 
											? new Date(result.updated_at).toLocaleDateString()
											: "未知"
										}
									</Text>
								</div>
								<div>
									<Text type="secondary">记录数量：</Text>
									<Text>{result.records?.length || 0} 条</Text>
								</div>
							</div>

							{/* 操作按钮 */}
							<div className="flex gap-2 pt-2">
								<Link href={`/search?q=${encodeURIComponent(result.value)}`}>
									<Button size="small" icon={<SearchOutlined />}>
										查看详细搜索结果
									</Button>
								</Link>
								{result.records && result.records.length > 0 && (
									<Link href={`/blacklist/public/${result.records[0].id}`}>
										<Button size="small" type="primary" icon={<EyeOutlined />}>
											查看详情
										</Button>
									</Link>
								)}
							</div>
						</>
					)}

					{/* 未命中时的建议 */}
					{!result.hit && (
						<Alert
							type="info"
							message="未发现失信记录"
							description="这是一个好消息！但请注意，数据可能存在延迟，建议定期查询以获取最新信息。"
							showIcon
						/>
					)}
				</div>
			</Card>
		);
	};

	return (
		<Card title="🔍 快速查验" className="w-full">
			<div className="space-y-4">
				{/* 查询输入 */}
				<div className="flex gap-2">
					<Select
						value={type}
						onChange={setType}
						style={{ width: 120 }}
						options={[
							{ label: "个人", value: "person" },
							{ label: "企业", value: "company" },
							{ label: "组织", value: "organization" },
						]}
					/>
					<Search
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							getSuggestions(e.target.value);
						}}
						placeholder={`输入${type === 'person' ? '姓名或身份证' : type === 'company' ? '企业名称' : '组织名称'}`}
						enterButton="查验"
						loading={loading}
						onSearch={performLookup}
						allowClear
					/>
				</div>

				{/* 搜索建议 */}
				{suggestions.length > 0 && (
					<Card size="small" className="bg-gray-50">
						<Text type="secondary" className="text-xs">搜索建议：</Text>
						<div className="flex flex-wrap gap-1 mt-1">
							{suggestions.map((suggestion, index) => (
								<Tag
									key={index}
									className="cursor-pointer"
									onClick={() => {
										setValue(suggestion.value);
										performLookup(suggestion.value);
									}}
								>
									{suggestion.value} ({suggestion.count})
								</Tag>
							))}
						</div>
					</Card>
				)}

				{/* 搜索历史 */}
				{searchHistory.length > 0 && !loading && !result && (
					<Card size="small" className="bg-gray-50">
						<div className="flex items-center gap-2 mb-2">
							<HistoryOutlined className="text-gray-500" />
							<Text type="secondary" className="text-xs">最近查询：</Text>
						</div>
						<div className="flex flex-wrap gap-1">
							{searchHistory.map((item, index) => (
								<Tag
									key={index}
									className="cursor-pointer"
									onClick={() => {
										setValue(item);
										performLookup(item);
									}}
								>
									{item}
								</Tag>
							))}
						</div>
					</Card>
				)}

				{/* 查询结果 */}
				{renderResult()}

				{/* 功能说明 */}
				<Alert
					type="info"
					message="快速查验说明"
					description="支持姓名、身份证号、企业名称等精确查询。如需模糊搜索或查看更多结果，请使用搜索功能。"
					showIcon
					className="text-xs"
				/>
			</div>
		</Card>
	);
}
