"use client";
import { Button, Card, Form, Input, message, Typography } from "antd";
import type { AxiosError } from "axios";
import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";

export default function LoginPage() {
	const router = useRouter();
	const [form] = Form.useForm();

	const onFinish = async (values: { username: string; password: string }) => {
		try {
			await axios.post("/api/auth/login", values);
			message.success("登录成功");
			router.push("/dashboard");
		} catch (e) {
			const err = e as AxiosError<{ message?: string }>;
			message.error(err?.response?.data?.message || "登录失败");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card title="登录" className="w-full max-w-md">
				<Form form={form} layout="vertical" onFinish={onFinish}>
					<Form.Item
						name="username"
						label="用户名"
						rules={[{ required: true }]}
					>
						<Input placeholder="请输入用户名" />
					</Form.Item>
					<Form.Item name="password" label="密码" rules={[{ required: true }]}>
						<Input.Password placeholder="请输入密码" />
					</Form.Item>
					<Form.Item>
						<Button type="primary" htmlType="submit" block>
							登录
						</Button>
					</Form.Item>
				</Form>
				<Typography.Paragraph type="secondary">
					还没有账号？前往{" "}
					<a href="/register" className="text-blue-600">
						注册
					</a>
				</Typography.Paragraph>
			</Card>
		</div>
	);
}
