"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface RouteGuardProps {
	children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
	const { user, loading, isGuest } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!loading) {
			// 定义完全公开路由（无需任何认证）
			const publicRoutes = [
				"/login",
				"/register",
				"/help",
				"/terms",
				"/privacy",
			];

			// 定义游客可访问路由（游客模式或已登录）
			const guestRoutes = [
				"/",
				"/blacklist/public",
				"/search",
				"/stats/public",
			];

			// 定义受保护路由（必须登录）
			const protectedRoutes = [
				"/dashboard",
				"/blacklist/new",
				"/blacklist/edit",
				"/profile",
				"/defaulters",
				"/contributors",
				"/rankings",
				"/users",
				"/admin",
			];

			const isPublicRoute = publicRoutes.includes(pathname);
			const isGuestRoute = guestRoutes.some((route) =>
				pathname.startsWith(route),
			);
			const isProtectedRoute = protectedRoutes.some((route) =>
				pathname.startsWith(route),
			);

			if (user) {
				// 用户已登录
				if (isPublicRoute) {
					// 已登录用户访问登录/注册页面，重定向到仪表盘
					router.replace("/dashboard");
				}
			} else if (isGuest) {
				// 游客模式
				if (isProtectedRoute) {
					// 游客访问受保护页面，保持在当前页面但显示限制提示
					// 这里不重定向，而是通过UI组件显示升级提示
				}
			} else {
				// 未登录且非游客模式
				if (isProtectedRoute || (!isPublicRoute && !isGuestRoute)) {
					// 未登录用户访问受保护页面，重定向到登录页
					router.replace("/login");
				}
			}
		}
	}, [user, loading, isGuest, pathname, router]);

	// 如果正在加载认证状态，显示加载页面
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
						<span className="text-2xl text-white font-bold">B</span>
					</div>
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
					<p className="text-gray-600 text-lg">加载中...</p>
					<p className="text-gray-400 text-sm">正在验证您的身份</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
