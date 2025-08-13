"use client";

import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message, Select } from "antd";
import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";

export default function NewBlacklistPage() {
	const [form] = Form.useForm();
	const router = useRouter();
	const typeValue = Form.useWatch("type", form);

	const valuePlaceholder = (() => {
		switch (typeValue) {
			case "email":
				return "例如: user@example.com";
			case "ip":
				return "例如: 192.168.1.1";
			case "phone":
				return "例如: 13812345678";
			case "domain":
				return "例如: example.com";
			default:
				return "请输入标的值";
		}
	})();

	const valueRules = [
		{ required: true, message: "请填写值" },
		({ getFieldValue }: any) => ({
			validator(_: unknown, v: string) {
				const t = getFieldValue("type");
				if (!v) return Promise.resolve();
				if (t === "email") {
					const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
					return ok ? Promise.resolve() : Promise.reject("请输入有效邮箱");
				}
				if (t === "ip") {
					const ok = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(v);
					return ok
						? Promise.resolve()
						: Promise.reject("请输入有效 IPv4 地址");
				}
				if (t === "domain") {
					const ok =
						/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(v);
					return ok ? Promise.resolve() : Promise.reject("请输入有效域名");
				}
				if (t === "phone") {
					const ok = /^1[3-9]\d{9}$/.test(v);
					return ok ? Promise.resolve() : Promise.reject("请输入有效手机号");
				}
				return Promise.resolve();
			},
		}),
	];

	const onFinish = async (values: Record<string, unknown>) => {
		const res = await axios.post("/api/blacklist", values);
		const docId = res.data?.doc?._id || res.data?._id;
		if (res.data?.merged) message.info("检测到重复，已合并来源");
		message.success("已保存");
		if (docId) router.push(`/blacklist/${docId}?created=1`);
		else router.push("/blacklist");
	};
	return (
		<div className="p-6">
			<Card className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold">创建黑名单条目</h2>
						<p className="text-neutral-500 text-sm">
							填写必要字段，保存后可在详情页继续流转
						</p>
					</div>
					<Button type="primary" onClick={() => form.submit()}>
						保存
					</Button>
				</div>
				<div className="my-4 border-t" />
				<Form
					form={form}
					layout="vertical"
					onFinish={onFinish}
					initialValues={{ type: "user", risk_level: "medium" }}
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Form.Item name="type" label="类型" rules={[{ required: true }]}>
							<div className="text-neutral-500 text-xs -mt-2 mb-2">
								<InfoCircleOutlined className="mr-1" />
								例如：abuse.spam、fraud.chargeback
							</div>

							<Select
								options={[
									{ label: "用户", value: "user" },
									{ label: "IP", value: "ip" },
									{ label: "邮箱", value: "email" },
									{ label: "手机号", value: "phone" },
									{ label: "域名", value: "domain" },
								]}
							/>
						</Form.Item>
						<Form.Item name="value" label="值" rules={valueRules as any}>
							<Input placeholder={valuePlaceholder} />
						</Form.Item>
						<Form.Item
							name="risk_level"
							label="风险等级"
							rules={[{ required: true }]}
						>
							<Select
								options={[
									{ label: "低", value: "low" },
									{ label: "中", value: "medium" },
									{ label: "高", value: "high" },
								]}
							/>
						</Form.Item>
						<Form.Item
							name="reason_code"
							label="理由码"
							rules={[{ required: true }]}
						>
							<Input placeholder="例如: abuse.spam, fraud.chargeback" />
						</Form.Item>
						<Form.Item name="expires_at" label="到期时间">
							<Input type="date" />
						</Form.Item>
						<Form.Item name="source" label="来源">
							<Input placeholder="例如: 举报人/系统/外部链接" />
						</Form.Item>
					</div>
					<Form.Item
						name="reason"
						label="原因摘要"
						rules={[{ required: true, min: 5 }]}
					>
						<Input.TextArea rows={5} />
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
}
