"use client";
import React, { useState, useEffect } from "react";
import { Card, Button, Space, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function TestResponsivePage() {
	const [screenSize, setScreenSize] = useState("unknown");

	// 检测屏幕尺寸
	const detectScreenSize = () => {
		const width = window.innerWidth;
		if (width < 640) return "sm (< 640px)";
		if (width < 768) return "md (640px - 768px)";
		if (width < 1024) return "lg (768px - 1024px)";
		if (width < 1280) return "xl (1024px - 1280px)";
		return "2xl (> 1280px)";
	};

	// 监听窗口大小变化
	useEffect(() => {
		const handleResize = () => {
			setScreenSize(detectScreenSize());
		};
		
		handleResize(); // 初始检测
		window.addEventListener('resize', handleResize);
		
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className="container mx-auto p-6 space-y-6">
			<Card>
				<Title level={2}>响应式菜单测试页面</Title>
				<Paragraph>
					这个页面用于测试新的响应式菜单栏设计。请尝试调整浏览器窗口大小来查看不同断点下的菜单表现。
				</Paragraph>
				
				<div className="bg-blue-50 p-4 rounded-lg mb-4">
					<Title level={4}>当前屏幕尺寸: {screenSize}</Title>
				</div>

				<Space direction="vertical" size="large" className="w-full">
					<Card title="移动端测试 (< 768px)" size="small">
						<ul className="space-y-2 text-sm">
							<li>✅ 汉堡菜单按钮应该显示在左上角</li>
							<li>✅ 品牌名称在小屏幕上应该隐藏</li>
							<li>✅ 游客标签应该显示为简化版本</li>
							<li>✅ 桌面端导航菜单应该隐藏</li>
							<li>✅ 用户头像旁的用户名应该隐藏</li>
						</ul>
					</Card>

					<Card title="平板端测试 (768px - 1024px)" size="small">
						<ul className="space-y-2 text-sm">
							<li>✅ 汉堡菜单应该隐藏</li>
							<li>✅ 核心菜单项应该显示（查询、名单、帮助）</li>
							<li>✅ 用户功能菜单应该隐藏</li>
							<li>✅ 品牌名称应该显示</li>
						</ul>
					</Card>

					<Card title="桌面端测试 (1024px - 1280px)" size="small">
						<ul className="space-y-2 text-sm">
							<li>✅ 所有核心菜单项应该显示</li>
							<li>✅ 用户功能菜单应该显示（仪表盘、管理失信、举报失信）</li>
							<li>✅ 扩展功能菜单应该隐藏</li>
							<li>✅ 用户名应该显示</li>
						</ul>
					</Card>

					<Card title="大屏幕测试 (> 1280px)" size="small">
						<ul className="space-y-2 text-sm">
							<li>✅ 所有菜单项应该显示</li>
							<li>✅ 管理员功能应该显示（如果有权限）</li>
							<li>✅ 游客状态显示应该完整</li>
							<li>✅ 所有文本应该完整显示</li>
						</ul>
					</Card>
				</Space>

				<div className="mt-6 p-4 bg-gray-50 rounded-lg">
					<Title level={4}>测试说明</Title>
					<Paragraph>
						1. 在移动端（&lt; 768px）点击左上角的汉堡菜单按钮<br/>
						2. 查看侧边栏菜单的分组和布局<br/>
						3. 测试菜单项的点击和导航功能<br/>
						4. 在不同屏幕尺寸下查看菜单项的显示/隐藏逻辑<br/>
						5. 测试游客模式和登录用户模式的差异
					</Paragraph>
				</div>
			</Card>
		</div>
	);
}
