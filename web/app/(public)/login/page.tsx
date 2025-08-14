"use client";
import {
	LockOutlined,
	LoginOutlined,
	SafetyCertificateOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { Button, Divider, Form, Input, message, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import "../auth-styles.css";

const { Title, Text } = Typography;

export default function LoginPage() {
	const { login } = useAuth();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const onFinish = async (values: { username: string; password: string }) => {
		setLoading(true);
		try {
			await login(values.username, values.password);
			message.success("登录成功，欢迎回来！");
		} catch (e) {
			const error = e as Error;
			message.error(error.message || "登录失败，请检查用户名和密码");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full min-h-screen relative overflow-hidden">
			{/* 渐变背景 */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
				{/* 装饰性几何图形 */}
				<div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
				<div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
				<div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
			</div>

			{/* 主要内容 */}
			<div className="relative z-10 min-h-screen flex items-center justify-center p-4">
				<div className="w-full max-w-md">
					{/* 品牌标识 */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
							<SafetyCertificateOutlined className="text-2xl text-white" />
						</div>
						<Title
							level={2}
							className="!mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
						>
							BlacklistHub
						</Title>
						<Text type="secondary" className="text-base">
							安全可信的黑名单管理平台
						</Text>
					</div>

					{/* 登录卡片 */}
					<div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
						<div className="text-center mb-6">
							<Title level={3} className="!mb-2">
								欢迎回来
							</Title>
							<Text type="secondary">请登录您的账户以继续使用</Text>
						</div>

						<Form
							form={form}
							layout="vertical"
							onFinish={onFinish}
							size="large"
							className="space-y-4"
						>
							<Form.Item
								name="username"
								rules={[
									{ required: true, message: "请输入用户名" },
									{ min: 3, message: "用户名至少3个字符" },
								]}
							>
								<Input
									prefix={<UserOutlined className="text-gray-400" />}
									placeholder="请输入用户名"
									className="rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500"
								/>
							</Form.Item>

							<Form.Item
								name="password"
								rules={[
									{ required: true, message: "请输入密码" },
									{ min: 6, message: "密码至少6个字符" },
								]}
							>
								<Input.Password
									prefix={<LockOutlined className="text-gray-400" />}
									placeholder="请输入密码"
									className="rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500"
								/>
							</Form.Item>

							<Form.Item className="!mb-6">
								<Button
									type="primary"
									htmlType="submit"
									loading={loading}
									icon={<LoginOutlined />}
									className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 border-none shadow-lg hover:shadow-xl transition-all duration-300 text-base font-medium"
								>
									{loading ? "登录中..." : "立即登录"}
								</Button>
							</Form.Item>
						</Form>

						<Divider className="!my-6">
							<Text type="secondary" className="text-sm">
								其他选项
							</Text>
						</Divider>

						<div className="text-center space-y-4">
							<div>
								<Text type="secondary" className="text-sm">
									还没有账号？
								</Text>
								<Link
									href="/register"
									className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
								>
									立即注册
								</Link>
							</div>

							<div>
								<Link
									href="/"
									className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
								>
									返回首页
								</Link>
							</div>
						</div>
					</div>

					{/* 底部信息 */}
					<div className="text-center mt-8">
						<Text type="secondary" className="text-xs">
							© 2024 BlacklistHub. 保护您的数字安全
						</Text>
					</div>
				</div>
			</div>
		</div>
	);
}
