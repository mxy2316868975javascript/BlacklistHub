"use client";
import { SearchOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import axios from "axios";
import React, { useState, useCallback } from "react";
import { useSearchDebounce } from "@/hooks/useDebounce";

interface SearchSuggestion {
	value: string;
	type: string;
	count: number;
	risk_level: string;
}

interface SearchInputProps {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	onSearch?: (value: string) => void;
	onSelect?: (value: string) => void;
	type?: "person" | "company" | "organization" | "all";
	size?: "small" | "middle" | "large";
	allowClear?: boolean;
	disabled?: boolean;
	className?: string;
	style?: React.CSSProperties;
	maxSuggestions?: number;
	minSearchLength?: number;
	debounceDelay?: number;
}

export default function SearchInput({
	placeholder = "请输入搜索关键词",
	value,
	onChange,
	onSearch,
	onSelect,
	type = "all",
	size = "middle",
	allowClear = true,
	disabled = false,
	className,
	style,
	maxSuggestions = 8,
	minSearchLength = 2,
	debounceDelay = 300,
}: SearchInputProps) {
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [loading, setLoading] = useState(false);

	// 获取搜索建议的原始函数
	const getSuggestionsOriginal = useCallback(async (query: string) => {
		if (query.length < minSearchLength) {
			setSuggestions([]);
			return;
		}

		setLoading(true);
		try {
			const response = await axios.get("/api/blacklist/suggestions", {
				params: { 
					q: query, 
					type: type === "all" ? undefined : type, 
					limit: maxSuggestions 
				}
			});
			setSuggestions(response.data.suggestions || []);
		} catch (error) {
			console.error("Failed to fetch suggestions:", error);
			setSuggestions([]);
		} finally {
			setLoading(false);
		}
	}, [type, maxSuggestions, minSearchLength]);

	// 防抖的搜索建议函数
	const getSuggestions = useSearchDebounce(
		getSuggestionsOriginal, 
		debounceDelay, 
		minSearchLength
	);

	// 处理输入变化
	const handleInputChange = (inputValue: string) => {
		onChange?.(inputValue);
		getSuggestions(inputValue);
	};

	// 处理选择建议
	const handleSelect = (selectedValue: string) => {
		onSelect?.(selectedValue);
		setSuggestions([]); // 清空建议列表
	};

	// 处理搜索
	const handleSearch = (searchValue: string) => {
		onSearch?.(searchValue);
		setSuggestions([]); // 清空建议列表
	};

	// 格式化建议选项
	const formatSuggestions = () => {
		return suggestions.map((suggestion) => {
			// 风险等级颜色映射
			const riskColors = {
				high: "#f5222d",
				medium: "#faad14", 
				low: "#52c41a"
			};

			// 风险等级文本映射
			const riskTexts = {
				high: "高风险",
				medium: "中风险",
				low: "低风险"
			};

			return {
				value: suggestion.value,
				label: (
					<div className="flex items-center justify-between py-1">
						<div className="flex items-center gap-2">
							<span className="font-medium">{suggestion.value}</span>
							<span 
								className="px-2 py-0.5 rounded text-xs font-medium text-white"
								style={{ backgroundColor: riskColors[suggestion.risk_level as keyof typeof riskColors] }}
							>
								{riskTexts[suggestion.risk_level as keyof typeof riskTexts]}
							</span>
						</div>
						<div className="flex items-center gap-2 text-xs text-gray-500">
							<span>{suggestion.count} 条记录</span>
							<span className="capitalize">{suggestion.type}</span>
						</div>
					</div>
				),
			};
		});
	};

	return (
		<AutoComplete
			value={value}
			options={formatSuggestions()}
			onSelect={handleSelect}
			onSearch={handleInputChange}
			placeholder={placeholder}
			size={size}
			allowClear={allowClear}
			disabled={disabled}
			className={className}
			style={style}
			notFoundContent={loading ? "搜索中..." : suggestions.length === 0 && value && value.length >= minSearchLength ? "暂无建议" : null}
			dropdownMatchSelectWidth={false}
			dropdownStyle={{ minWidth: 300 }}
		>
			<Input.Search
				placeholder={placeholder}
				enterButton={<SearchOutlined />}
				size={size}
				onSearch={handleSearch}
				loading={loading}
			/>
		</AutoComplete>
	);
}

// 简化版搜索输入框，只有输入功能，没有建议
export function SimpleSearchInput({
	placeholder = "请输入搜索关键词",
	value,
	onChange,
	onSearch,
	size = "middle",
	allowClear = true,
	disabled = false,
	className,
	style,
	debounceDelay = 300,
}: Omit<SearchInputProps, "onSelect" | "type" | "maxSuggestions" | "minSearchLength">) {
	// 防抖的输入处理函数
	const debouncedOnChange = useSearchDebounce(
		useCallback((inputValue: string) => {
			onChange?.(inputValue);
		}, [onChange]),
		debounceDelay,
		0 // 不限制最小长度
	);

	return (
		<Input.Search
			placeholder={placeholder}
			value={value}
			onChange={(e) => debouncedOnChange(e.target.value)}
			onSearch={onSearch}
			enterButton={<SearchOutlined />}
			size={size}
			allowClear={allowClear}
			disabled={disabled}
			className={className}
			style={style}
		/>
	);
}

// 快速搜索输入框，专门用于快速查验场景
export function QuickSearchInput({
	placeholder = "请输入要查验的信息",
	value,
	onChange,
	onSearch,
	type = "person",
	size = "large",
	className,
	style,
}: Pick<SearchInputProps, "placeholder" | "value" | "onChange" | "onSearch" | "type" | "size" | "className" | "style">) {
	return (
		<SearchInput
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			onSearch={onSearch}
			onSelect={onSearch} // 选择建议时直接搜索
			type={type}
			size={size}
			className={className}
			style={style}
			maxSuggestions={5}
			minSearchLength={2}
			debounceDelay={300}
		/>
	);
}
