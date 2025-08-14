"use client";

import { Button, Card, Form, Input, message, Select, Space } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import type { Blacklist } from "@/types/user";
import WangEditorWrapper from "./WangEditorWrapper";

interface BlacklistFormData {
	type: string;
	value: string;
	company_name?: string;
	risk_level: string;
	reason_code: string;
	source: string;
	region?: string;
}

interface BlacklistFormProps {
	initialData?: Partial<Blacklist>;
	onSubmit?: (data: Blacklist) => void;
	onCancel?: () => void;
	mode?: "create" | "edit";
}

export default function BlacklistForm({
	initialData,
	onSubmit,
	onCancel,
	mode = "create",
}: BlacklistFormProps) {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [selectedType, setSelectedType] = useState(initialData?.type || "");
	const [reasonContent, setReasonContent] = useState(initialData?.reason || "");

	useEffect(() => {
		if (initialData) {
			form.setFieldsValue(initialData);
			setSelectedType(initialData.type || "");
			setReasonContent(initialData.reason || "");
		}
	}, [initialData, form]);

	const handleSubmit = async (values: BlacklistFormData) => {
		setLoading(true);
		try {
			const submitData = {
				...values,
				reason: reasonContent,
			};

			if (mode === "create") {
				const response = await axios.post("/api/blacklist", submitData);
				message.success("黑名单条目创建成功");
				onSubmit?.(response.data);
			} else {
				const response = await axios.put(
					`/api/blacklist/${initialData?._id}`,
					submitData,
				);
				message.success("黑名单条目更新成功");
				onSubmit?.(response.data);
			}

			// 重置表单
			if (mode === "create") {
				form.resetFields();
				setReasonContent("");
				setSelectedType("");
			}
		} catch (error: unknown) {
			console.error("提交失败:", error);
			if (axios.isAxiosError(error)) {
				message.error(error.response?.data?.message || "操作失败");
			} else {
				message.error("操作失败");
			}
		} finally {
			setLoading(false);
		}
	};

	const typeOptions = [
		{ label: "用户", value: "user" },
		{ label: "IP地址", value: "ip" },
		{ label: "邮箱", value: "email" },
		{ label: "手机号", value: "phone" },
		{ label: "公司", value: "company" },
		{ label: "域名", value: "domain" },
		{ label: "其他", value: "other" },
	];

	const riskLevelOptions = [
		{ label: "低风险", value: "low" },
		{ label: "中等风险", value: "medium" },
		{ label: "高风险", value: "high" },
	];

	const reasonCodeOptions = [
		{ label: "支付欺诈", value: "fraud.payment" },
		{ label: "拒付欺诈", value: "fraud.chargeback" },
		{ label: "身份欺诈", value: "fraud.identity" },
		{ label: "账户欺诈", value: "fraud.account" },
		{ label: "垃圾信息", value: "abuse.spam" },
		{ label: "骚扰行为", value: "abuse.harassment" },
		{ label: "钓鱼攻击", value: "abuse.phishing" },
		{ label: "恶意软件", value: "abuse.malware" },
		{ label: "违反条款", value: "violation.terms" },
		{ label: "违反政策", value: "violation.policy" },
		{ label: "法律违规", value: "violation.legal" },
		{ label: "安全漏洞", value: "security.breach" },
		{ label: "可疑行为", value: "security.suspicious" },
		{ label: "虚假信息", value: "quality.fake" },
		{ label: "重复内容", value: "quality.duplicate" },
		{ label: "人工标记", value: "other.manual" },
		{ label: "系统检测", value: "other.system" },
	];

	const sourceOptions = [
		{ label: "用户举报", value: "user_report" },
		{ label: "系统检测", value: "system_detection" },
		{ label: "人工审核", value: "manual_review" },
		{ label: "外部数据", value: "external_data" },
		{ label: "合作伙伴", value: "partner" },
		{ label: "监管要求", value: "regulatory" },
		{ label: "其他", value: "other" },
	];

	return (
		<div className="blacklist-form">
			<Card title={mode === "create" ? "创建黑名单条目" : "编辑黑名单条目"}>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
					initialValues={{
						risk_level: "medium",
						source: "user_report",
						region: "CN",
					}}
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Form.Item
							name="type"
							label="类型"
							rules={[{ required: true, message: "请选择类型" }]}
						>
							<Select
								placeholder="选择类型"
								onChange={setSelectedType}
								options={typeOptions}
							/>
						</Form.Item>

						<Form.Item
							name="value"
							label="值"
							rules={[{ required: true, message: "请输入值" }]}
						>
							<Input placeholder="输入具体值" />
						</Form.Item>

						{selectedType === "company" && (
							<Form.Item
								name="company_name"
								label="公司名称"
								rules={[{ required: true, message: "请输入公司名称" }]}
							>
								<Input placeholder="输入公司名称" />
							</Form.Item>
						)}

						<Form.Item
							name="risk_level"
							label="风险等级"
							rules={[{ required: true, message: "请选择风险等级" }]}
						>
							<Select placeholder="选择风险等级" options={riskLevelOptions} />
						</Form.Item>

						<Form.Item
							name="reason_code"
							label="理由代码"
							rules={[{ required: true, message: "请选择理由代码" }]}
						>
							<Select placeholder="选择理由代码" options={reasonCodeOptions} />
						</Form.Item>

						<Form.Item
							name="source"
							label="来源"
							rules={[{ required: true, message: "请选择来源" }]}
						>
							<Select placeholder="选择来源" options={sourceOptions} />
						</Form.Item>

						<Form.Item name="region" label="地区">
							<Input placeholder="输入地区代码（如：CN、US）" />
						</Form.Item>
					</div>

					<div className="mb-4">
						<label
							htmlFor="reason-editor"
							className="block text-sm font-medium mb-2"
						>
							详细理由 <span className="text-red-500">*</span>
						</label>
						<WangEditorWrapper
							id="reason-editor"
							value={reasonContent}
							onChange={setReasonContent}
							placeholder="请详细描述违规行为，可以插入图片和格式化文本作为证据..."
							height={250}
						/>
					</div>

					<Form.Item>
						<Space>
							<Button type="primary" htmlType="submit" loading={loading}>
								{mode === "create" ? "创建" : "更新"}
							</Button>
							{onCancel && <Button onClick={onCancel}>取消</Button>}
						</Space>
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
}
