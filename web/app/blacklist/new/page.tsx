"use client";

import { Button, Card, Form, Input, message, Select } from "antd";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
	REASON_CODE_OPTIONS,
	REGION_OPTIONS_FLAT,
	RISK_LEVEL_OPTIONS,
	SOURCE_OPTIONS,
	TYPE_OPTIONS,
} from "@/types/blacklist";

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
		({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
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
		// 确保地区字段始终存在，即使为空也要传递
		const submitData = {
			...values,
			region: values.region || null, // 确保地区字段存在
		};
		const res = await axios.post("/api/blacklist", submitData);
		const docId = res.data?.doc?._id || res.data?._id;
		if (res.data?.merged) message.info("检测到重复，已合并来源");
		message.success("已保存");
		if (docId) router.push(`/blacklist/${docId}?created=1`);
		else router.push("/blacklist");
	};
	return (
		<div className="p-6">
			<Card className="mx-auto">
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
				<Form
					form={form}
					layout="vertical"
					onFinish={onFinish}
					initialValues={{ type: "user", risk_level: "medium" }}
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Form.Item name="type" label="类型" rules={[{ required: true }]}>
							<Select options={TYPE_OPTIONS} />
						</Form.Item>
						<Form.Item name="value" label="值" rules={valueRules}>
							<Input placeholder={valuePlaceholder} />
						</Form.Item>
						<Form.Item
							name="risk_level"
							label="风险等级"
							rules={[{ required: true }]}
						>
							<Select options={RISK_LEVEL_OPTIONS} />
						</Form.Item>
						<Form.Item
							name="reason_code"
							label="理由码"
							rules={[{ required: true }]}
						>
							<Select
								placeholder="请选择理由码"
								options={REASON_CODE_OPTIONS}
								showSearch
								filterOption={(input, option) =>
									(option?.label ?? "")
										.toLowerCase()
										.includes(input.toLowerCase())
								}
							/>
						</Form.Item>
						<Form.Item name="expires_at" label="到期时间">
							<Input type="date" />
						</Form.Item>
						<Form.Item name="source" label="来源">
							<Select
								placeholder="请选择来源"
								allowClear
								options={SOURCE_OPTIONS}
							/>
						</Form.Item>
						<Form.Item name="region" label="地区">
							<Select
								placeholder="请选择地区"
								allowClear
								options={REGION_OPTIONS_FLAT}
								showSearch
								optionFilterProp="label"
								filterOption={(input, option) => {
									if (!input) return true;
									const searchText = input.toLowerCase();
									return (option?.label ?? "")
										.toLowerCase()
										.includes(searchText);
								}}
							/>
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
