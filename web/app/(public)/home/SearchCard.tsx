"use client";
import { Button, Card, DatePicker, Input, message, Select } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useDebounce, useInputDebounce } from "@/hooks/useDebounce";
import {
	type BlacklistItem,
	type BlacklistStatus,
	BlacklistType,
	getReasonCodeLabel,
	getRegionLabel,
	getSourceLabel,
	REASON_CODE_OPTIONS,
	REGION_OPTIONS_FLAT,
	type ReasonCode,
	type Region,
	RISK_LEVEL_OPTIONS,
	type RiskLevel,
	SOURCE_OPTIONS,
	type SourceType,
	STATUS_OPTIONS,
	TYPE_OPTIONS,
} from "@/types/blacklist";
import type { UserInfo } from "@/types/user";

export default function SearchCard() {
	const router = useRouter();
	const [loading, setLoading] = React.useState(false);
	const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
	const [result, setResult] = React.useState<{
		total?: number;
		items?: BlacklistItem[];
	}>({});

	const [form, setForm] = React.useState({
		type: undefined as BlacklistType | undefined,
		risk_level: undefined as RiskLevel | undefined,
		status: undefined as BlacklistStatus | undefined,
		source: undefined as SourceType | undefined,
		reason_code: undefined as ReasonCode | undefined,
		region: undefined as Region | undefined,
		keyword: "",
		start: undefined as string | undefined,
		end: undefined as string | undefined,
	});

	const [page, setPage] = React.useState(1);
	const [hasMore, setHasMore] = React.useState(true);

	// 获取当前用户信息
	useEffect(() => {
		const fetchUserInfo = async () => {
			try {
				const response = await axios.get("/api/me");
				setCurrentUser(response.data.user);
			} catch {
				// 如果获取用户信息失败，可能是未登录用户，设置为null
				setCurrentUser(null);
			}
		};

		fetchUserInfo();
	}, []);

	// 根据用户角色和创建者身份决定跳转的URL
	const getDetailUrl = (item: BlacklistItem) => {
		if (!currentUser) {
			// 未登录用户，跳转到预览页面
			return `/blacklist/${item._id}/preview`;
		}

		const highPrivilegedRoles = ["reviewer", "admin", "super_admin"];
		const isHighPrivileged = highPrivilegedRoles.includes(currentUser.role);
		const isCreator = item.operator === currentUser.username;

		// 只有高权限用户(reviewer/admin/super_admin)或创建者可以编辑
		if (isHighPrivileged || isCreator) {
			// 高权限用户或创建者，跳转到详情页面
			return `/blacklist/${item._id}`;
		}
		// 其他用户(包括非创建者的reporter)，跳转到预览页面
		return `/blacklist/${item._id}/preview`;
	};

	const loadData = useCallback(
		async (pageNum: number, reset = false) => {
			setLoading(true);
			try {
				const res = await axios.get("/api/blacklist", {
					params: { ...form, page: pageNum, pageSize: 10 },
				});
				const total = res.data?.total || 0;
				const newItemsCount = res.data?.items?.length || 0;

				if (reset) {
					setResult(res.data || {});
					setPage(pageNum);
					setHasMore(newItemsCount === 10 && pageNum * 10 < total);
				} else {
					setResult((prev) => {
						const newItems = [
							...(prev.items || []),
							...(res.data?.items || []),
						];
						return {
							total: res.data?.total || prev.total,
							items: newItems,
						};
					});
					setPage(pageNum);
					// 检查是否还有更多数据
					setHasMore(pageNum * 10 < total);
				}
			} catch (e) {
				message.error(`查询失败 ${e}`);
			} finally {
				setLoading(false);
			}
		},
		[form],
	);

	// 防抖的自动搜索函数
	const debouncedAutoSearch = useDebounce(
		useCallback(() => {
			loadData(1, true);
		}, [loadData]),
		800 // 800ms延迟，避免频繁搜索
	);

	// 初始加载数据
	useEffect(() => {
		loadData(1, true);
	}, [loadData]);

	// 当表单变化时，触发防抖搜索（仅对关键词搜索启用自动搜索）
	useEffect(() => {
		// 只有当关键词不为空时才启用自动搜索
		if (form.keyword.trim()) {
			debouncedAutoSearch();
		}
	}, [form.keyword, debouncedAutoSearch]);

	const search = async () => {
		await loadData(1, true);
	};

	return (
		<div className="space-y-4">
			<Card className="!mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
					<Select
						allowClear={true}
						placeholder="类型"
						value={form.type}
						onChange={(v) => setForm((f) => ({ ...f, type: v }))}
						options={TYPE_OPTIONS}
					/>
					<Select
						allowClear={true}
						placeholder="风险等级"
						value={form.risk_level}
						onChange={(v) => setForm((f) => ({ ...f, risk_level: v }))}
						options={RISK_LEVEL_OPTIONS}
					/>
					<Select
						allowClear={true}
						placeholder="状态"
						value={form.status}
						onChange={(v) => setForm((f) => ({ ...f, status: v }))}
						options={STATUS_OPTIONS}
					/>
					<Select
						allowClear={true}
						placeholder="来源"
						value={form.source}
						onChange={(v) => setForm((f) => ({ ...f, source: v }))}
						options={SOURCE_OPTIONS}
					/>
					<Select
						allowClear={true}
						placeholder="理由码"
						value={form.reason_code}
						onChange={(v) => setForm((f) => ({ ...f, reason_code: v }))}
						options={REASON_CODE_OPTIONS}
						showSearch={true}
						filterOption={(input, option) =>
							(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
						}
					/>
					<Select
						allowClear={true}
						placeholder="地区"
						value={form.region}
						onChange={(v) => setForm((f) => ({ ...f, region: v }))}
						options={REGION_OPTIONS_FLAT}
						showSearch={true}
						optionFilterProp="label"
						filterOption={(input, option) => {
							if (!input) return true;
							const searchText = input.toLowerCase();
							return (option?.label ?? "").toLowerCase().includes(searchText);
						}}
					/>
					<Input
						placeholder="关键词（失信人/原因/操作人）"
						value={form.keyword}
						onChange={(e) =>
							setForm((f) => ({ ...f, keyword: e.target.value }))
						}
					/>
					<DatePicker
						placeholder="开始时间"
						className="w-full"
						value={form.start ? dayjs(form.start) : undefined}
						onChange={(d) =>
							setForm((f) => ({ ...f, start: d?.format("YYYY-MM-DD") }))
						}
					/>
					<DatePicker
						placeholder="结束时间"
						className="w-full"
						value={form.end ? dayjs(form.end) : undefined}
						onChange={(d) =>
							setForm((f) => ({ ...f, end: d?.format("YYYY-MM-DD") }))
						}
					/>
				</div>
				<div className="mt-3">
					<Button type="primary" onClick={search} loading={loading}>
						搜索
					</Button>
				</div>
			</Card>

			<div className="bg-gray-50 rounded-lg p-6">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<div className="w-2 h-6 bg-blue-500 rounded-full" />
						<h3 className="!mb-0 text-lg font-semibold text-gray-900">
							搜索结果
						</h3>
						<span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
							{result.total || 0} 条
						</span>
					</div>
					<Button
						type="primary"
						onClick={() => router.push("/blacklist/new")}
						className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-label="添加图标"
						>
							<title>添加</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v16m8-8H4"
							/>
						</svg>
						新增举报
					</Button>
				</div>

				{(result.items || []).length === 0 && !loading ? (
					<div className="text-center py-12">
						<div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
							<svg
								className="w-8 h-8 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-label="无数据图标"
							>
								<title>无数据</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<p className="text-gray-500">暂无数据</p>
					</div>
				) : (
					<div className="grid gap-4">
						{(result.items || []).map((i) => (
							<button
								key={i._id}
								type="button"
								onClick={() => router.push(getDetailUrl(i))}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										router.push(getDetailUrl(i));
									}
								}}
								className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:shadow-xl overflow-hidden border-t-4 ${
									i.risk_level === "high"
										? "border-t-red-500"
										: i.risk_level === "medium"
											? "border-t-orange-500"
											: "border-t-green-500"
								}`}
							>
								<div className="p-6">
									<div className="flex items-start gap-4">
										{/* 风险等级图标 */}
										<div
											className={`shrink-0 w-14 h-14 flex items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg ${
												i.risk_level === "high"
													? "bg-gradient-to-br from-red-500 to-red-600"
													: i.risk_level === "medium"
														? "bg-gradient-to-br from-orange-500 to-orange-600"
														: "bg-gradient-to-br from-green-500 to-green-600"
											}`}
										>
											{i.risk_level === "high"
												? "⚠️"
												: i.risk_level === "medium"
													? "⚡"
													: "✓"}
										</div>

										<div className="min-w-0 flex-1">
											{/* 主要信息行 */}
											<div className="flex items-center gap-3 mb-3">
												<h4 className="!mb-0 text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
													{i.value}
												</h4>
												<div className="flex items-center gap-2">
													<span
														className={`px-3 py-1 rounded-full text-xs font-semibold ${
															i.risk_level === "high"
																? "bg-red-100 text-red-700"
																: i.risk_level === "medium"
																	? "bg-orange-100 text-orange-700"
																	: "bg-green-100 text-green-700"
														}`}
													>
														{i.risk_level === "high"
															? "高风险"
															: i.risk_level === "medium"
																? "中风险"
																: "低风险"}
													</span>
													<span
														className={`px-3 py-1 rounded-full text-xs font-semibold ${
															i.status === "published"
																? "bg-green-100 text-green-700"
																: i.status === "pending"
																	? "bg-blue-100 text-blue-700"
																	: i.status === "rejected"
																		? "bg-red-100 text-red-700"
																		: i.status === "retracted"
																			? "bg-gray-100 text-gray-700"
																			: "bg-yellow-100 text-yellow-700"
														}`}
													>
														{i.status === "published"
															? "✅ 已发布"
															: i.status === "pending"
																? "⏳ 待复核"
																: i.status === "rejected"
																	? "❌ 已退回"
																	: i.status === "retracted"
																		? "🔄 已撤销"
																		: "📝 草稿"}
													</span>
												</div>
											</div>

											{/* 详细信息网格 */}
											<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
												<div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border-l-4 border-blue-400">
													<div className="text-xs text-blue-600 font-medium mb-1">
														类型
													</div>
													<div className="font-bold text-gray-900">
														{i.type === BlacklistType.PERSON
															? "👤 个人"
															: i.type === BlacklistType.COMPANY
																? "🏢 企业"
																: "🏛️ 组织"}
													</div>
												</div>
												<div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border-l-4 border-purple-400">
													<div className="text-xs text-purple-600 font-medium mb-1">
														理由码
													</div>
													<div
														className="font-bold text-gray-900 truncate"
														title={getReasonCodeLabel(i.reason_code)}
													>
														{getReasonCodeLabel(i.reason_code)}
													</div>
												</div>
												<div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 border-l-4 border-green-400">
													<div className="text-xs text-green-600 font-medium mb-1">
														来源
													</div>
													<div className="font-bold text-gray-900 truncate">
														{getSourceLabel(i.source)}
													</div>
												</div>
												<div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 border-l-4 border-orange-400">
													<div className="text-xs text-orange-600 font-medium mb-1">
														操作人
													</div>
													<div className="font-bold text-gray-900 truncate">
														{i.operator}
													</div>
												</div>
												<div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-3 border-l-4 border-indigo-400">
													<div className="text-xs text-indigo-600 font-medium mb-1">
														地区
													</div>
													<div className="font-bold text-gray-900 truncate">
														{getRegionLabel(i.region)}
													</div>
												</div>
											</div>

											{/* 举报理由 */}
											{i.reason && (
												<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200/50">
													<div className="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1">
														💬 举报理由
													</div>
													<div className="text-left text-sm text-blue-900 line-clamp-2 leading-relaxed">
														{i.reason}
													</div>
												</div>
											)}

											{/* 底部信息 */}
											<div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100/80">
												<div className="flex items-center gap-2 text-xs text-gray-500">
													<div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
													更新时间：
													{new Date(i.updated_at).toLocaleString("zh-CN")}
												</div>
												<div className="text-xs text-blue-600 font-medium group-hover:text-blue-700 flex items-center gap-1">
													查看详情
													<svg
														className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														aria-label="箭头图标"
													>
														<title>箭头</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M9 5l7 7-7 7"
														/>
													</svg>
												</div>
											</div>
										</div>
									</div>
								</div>
							</button>
						))}
					</div>
				)}

				{/* 加载更多按钮 */}
				{(result.items || []).length > 0 && (
					<>
						<div className="mt-6 w-full flex justify-center">
							<Button
								type="default"
								size="large"
								disabled={loading || !hasMore}
								onClick={async () => {
									const nextPage = page + 1;
									await loadData(nextPage, false);
								}}
								className="px-8 py-2 h-auto rounded-lg border-2 border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-700 font-medium"
							>
								{loading ? "加载中..." : hasMore ? "加载更多" : "没有更多数据"}
							</Button>
						</div>
						<div className="mt-6 flex justify-center">
							<div className="text-sm text-gray-500 mb-2">
								已显示 {result.items?.length || 0} / {result.total || 0} 条记录
								{hasMore ? " - 还有更多数据" : " - 已显示全部"}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
