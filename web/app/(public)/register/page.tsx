"use client";
import { Button, Card, Form, Input, Typography, message } from "antd";
import axios from "axios";
import React from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await axios.post("/api/auth/register", values);
      message.success("注册成功，请登录");
      router.push("/login");
    } catch {
      message.error("注册失败");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card title="注册" className="w-full max-w-md">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>注册</Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary">已有账号？去登录</Typography.Paragraph>
      </Card>
    </div>
  );
}

