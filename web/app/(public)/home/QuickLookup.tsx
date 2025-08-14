"use client";
import { Button, Card, Input, message, Select, Space, Tag } from "antd";
import axios from "axios";
import React from "react";

export default function QuickLookup() {
	const [type, setType] = React.useState<"person" | "company" | "organization">(
		"person",
	);
	const [value, setValue] = React.useState("");
	const [res, setRes] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);

	const lookup = async () => {
		if (!value) return message.warning("请输入要查验的失信人名称");
		setLoading(true);
		try {
			const r = await axios.get("/api/blacklist/lookup", {
				params: { type, value },
			});
			setRes(r.data);
		} catch {
			message.error("查询失败");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<div className="flex items-center gap-2">
				<Select
					value={type}
					onChange={setType}
					style={{ width: 140 }}
					options={[
						{ label: "个人", value: "person" },
						{ label: "企业", value: "company" },
						{ label: "组织", value: "organization" },
					]}
				/>
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="输入要快速查验的失信人名称"
					onPressEnter={lookup}
				/>
				<Button type="primary" onClick={lookup} loading={loading}>
					快速查验
				</Button>
			</div>
			{res && (
				<div className="mt-3 text-sm">
					<div>
						是否命中：
						<Tag color={res.hit ? "error" : "success"}>
							{res.hit ? "命中" : "未命中"}
						</Tag>
					</div>
					{res.hit && (
						<>
							<div>
								风险等级：
								<Tag
									color={
										res.risk_level === "high"
											? "error"
											: res.risk_level === "medium"
												? "warning"
												: "default"
									}
								>
									{res.risk_level}
								</Tag>
							</div>
							<div>最新状态：{res.status}</div>
							<div>来源数：{res.sources_count}</div>
							<div>
								最近更新时间：
								{res.updated_at
									? new Date(res.updated_at).toLocaleString()
									: "-"}
							</div>
						</>
					)}
				</div>
			)}
		</Card>
	);
}
