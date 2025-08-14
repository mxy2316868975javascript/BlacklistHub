"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface RouteGuardProps {
	children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
	const { user, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!loading) {
			// 定义公开路由（不需要登录即可访问）
			const publicRoutes = ["/login", "/register"];

			// 定义受保护路由（需要登录才能访问）
			const protectedRoutes = [
				"/dashboard",
				"/blacklist",
				"/defaulters",
				"/contributors",
				"/rankings",
				"/users",
				"/admin",
			];

			const isPublicRoute = publicRoutes.includes(pathname);
			const isProtectedRoute = protectedRoutes.some((route) =>
				pathname.startsWith(route),
			);
			const isHomePage = pathname === "/";

			if (user) {
				// 用户已登录
				if (isPublicRoute) {
					// 已登录用户访问登录/注册页面，重定向到仪表盘
					router.replace("/dashboard");
				} else if (isHomePage) {
					// 已登录用户访问首页，重定向到仪表盘
					router.replace("/dashboard");
				}
			} else {
				// 用户未登录
				if (isProtectedRoute) {
					// 未登录用户访问受保护页面，重定向到登录页
					router.replace("/login");
				} else if (isHomePage) {
					// 未登录用户访问首页，重定向到登录页
					router.replace("/login");
				}
			}
		}
	}, [user, loading, pathname, router]);

	// 如果正在加载认证状态，显示加载页面
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
						<span className="text-2xl text-white font-bold">B</span>
					</div>
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600 text-lg">加载中...</p>
					<p className="text-gray-400 text-sm">正在验证您的身份</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
