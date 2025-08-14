"use client";
import {
	CheckCircleOutlined,
	LockOutlined,
	MailOutlined,
	SafetyCertificateOutlined,
	UserAddOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Button,
	Divider,
	Form,
	Input,
	message,
	Progress,
	Typography,
} from "antd";
import type { AxiosError } from "axios";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../auth-styles.css";

const { Title, Text } = Typography;

export default function RegisterPage() {
	const router = useRouter();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);

	// 密码强度检测
	const checkPasswordStrength = (password: string) => {
		let strength = 0;
		if (password.length >= 6) strength += 25;
		if (password.length >= 8) strength += 25;
		if (/[A-Z]/.test(password)) strength += 25;
		if (/[0-9]/.test(password)) strength += 25;
		setPasswordStrength(strength);
	};

	const getPasswordStrengthColor = () => {
		if (passwordStrength < 25) return "#ff4d4f";
		if (passwordStrength < 50) return "#faad14";
		if (passwordStrength < 75) return "#1890ff";
		return "#52c41a";
	};

	const getPasswordStrengthText = () => {
		if (passwordStrength < 25) return "弱";
		if (passwordStrength < 50) return "一般";
		if (passwordStrength < 75) return "良好";
		return "强";
	};

	const onFinish = async (values: {
		username: string;
		password: string;
		confirmPassword: string;
		email?: string;
	}) => {
		setLoading(true);
		try {
			await axios.post("/api/auth/register", {
				username: values.username,
				password: values.password,
				email: values.email,
			});
			message.success("注册成功！欢迎加入 BlacklistHub，请登录");
			router.push("/login");
		} catch (e) {
			const err = e as AxiosError<{ message?: string }>;
			message.error(err?.response?.data?.message || "注册失败，请稍后重试");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full min-h-screen relative overflow-hidden">
			{/* 渐变背景 */}
			<div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
				{/* 装饰性几何图形 */}
				<div className="absolute top-0 left-0 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
				<div className="absolute top-0 right-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
				<div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
			</div>

			{/* 主要内容 */}
			<div className="relative z-10 min-h-screen flex items-center justify-center p-4">
				<div className="w-full max-w-md">
					{/* 品牌标识 */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
							<SafetyCertificateOutlined className="text-2xl text-white" />
						</div>
						<Title
							level={2}
							className="!mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
						>
							BlacklistHub
						</Title>
						<Text type="secondary" className="text-base">
							开始您的安全防护之旅
						</Text>
					</div>

					{/* 注册卡片 */}
					<div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
						<div className="text-center mb-6">
							<Title level={3} className="!mb-2">
								创建新账户
							</Title>
							<Text type="secondary">加入我们，共同构建更安全的网络环境</Text>
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
									{ max: 20, message: "用户名最多20个字符" },
									{
										pattern: /^[a-zA-Z0-9_]+$/,
										message: "用户名只能包含字母、数字和下划线",
									},
								]}
							>
								<Input
									prefix={<UserOutlined className="text-gray-400" />}
									placeholder="请输入用户名"
									className="rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500"
								/>
							</Form.Item>

							<Form.Item
								name="email"
								rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}
							>
								<Input
									prefix={<MailOutlined className="text-gray-400" />}
									placeholder="请输入邮箱地址（可选）"
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
									onChange={(e) => checkPasswordStrength(e.target.value)}
								/>
							</Form.Item>

							{/* 密码强度指示器 */}
							{passwordStrength > 0 && (
								<div className="mb-4">
									<div className="flex justify-between items-center mb-2">
										<Text className="text-sm text-gray-600">密码强度</Text>
										<Text
											className="text-sm"
											style={{ color: getPasswordStrengthColor() }}
										>
											{getPasswordStrengthText()}
										</Text>
									</div>
									<Progress
										percent={passwordStrength}
										strokeColor={getPasswordStrengthColor()}
										showInfo={false}
										size="small"
									/>
								</div>
							)}

							<Form.Item
								name="confirmPassword"
								dependencies={["password"]}
								rules={[
									{ required: true, message: "请确认密码" },
									({ getFieldValue }) => ({
										validator(_, value) {
											if (!value || getFieldValue("password") === value) {
												return Promise.resolve();
											}
											return Promise.reject(new Error("两次输入的密码不一致"));
										},
									}),
								]}
							>
								<Input.Password
									prefix={<CheckCircleOutlined className="text-gray-400" />}
									placeholder="请再次输入密码"
									className="rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500"
								/>
							</Form.Item>

							<Form.Item className="!mb-6">
								<Button
									type="primary"
									htmlType="submit"
									loading={loading}
									icon={<UserAddOutlined />}
									className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 border-none shadow-lg hover:shadow-xl transition-all duration-300 text-base font-medium"
								>
									{loading ? "注册中..." : "立即注册"}
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
									已有账号？
								</Text>
								<Link
									href="/login"
									className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
								>
									立即登录
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

						{/* 服务条款 */}
						<div className="mt-6 p-4 bg-gray-50 rounded-xl">
							<Text type="secondary" className="text-xs text-center block">
								注册即表示您同意我们的
								<Link
									href="/terms"
									className="text-blue-600 hover:text-blue-700 mx-1"
								>
									服务条款
								</Link>
								和
								<Link
									href="/privacy"
									className="text-blue-600 hover:text-blue-700 mx-1"
								>
									隐私政策
								</Link>
							</Text>
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
