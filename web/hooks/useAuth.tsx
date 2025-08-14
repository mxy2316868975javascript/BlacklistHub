"use client";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { UserInfo } from "@/types/user";

interface AuthContextType {
	user: UserInfo | null;
	loading: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const pathname = usePathname();

	// 判断是否为受保护的路由
	const isProtectedRoute = useCallback((path: string) => {
		const protectedPaths = [
			"/dashboard",
			"/blacklist",
			"/defaulters",
			"/contributors",
			"/rankings",
			"/users",
			"/admin",
		];
		return protectedPaths.some((protectedPath) =>
			path.startsWith(protectedPath),
		);
	}, []);

	// 检查用户认证状态
	const checkAuth = useCallback(async () => {
		try {
			const response = await axios.get("/api/userinfo");
			if (response.data?.user) {
				setUser(response.data.user);
				return response.data.user;
			} else {
				setUser(null);
				return null;
			}
		} catch {
			setUser(null);
			return null;
		}
	}, []);

	// 刷新用户信息
	const refreshUser = async () => {
		await checkAuth();
	};

	// 登录
	const login = async (username: string, password: string) => {
		const response = await axios.post("/api/auth/login", {
			username,
			password,
		});
		if (response.status === 200) {
			await checkAuth();
		}
	};

	// 退出登录
	const logout = async () => {
		try {
			await axios.post("/api/auth/logout");
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			setUser(null);
			// 广播登出事件到其他标签页
			localStorage.setItem(
				"auth-event",
				JSON.stringify({
					type: "logout",
					timestamp: Date.now(),
				}),
			);
			router.push("/login");
		}
	};

	// 监听其他标签页的认证状态变化
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "auth-event" && e.newValue) {
				try {
					const event = JSON.parse(e.newValue);
					if (event.type === "logout") {
						setUser(null);
						router.push("/login");
					} else if (event.type === "login") {
						checkAuth();
					}
				} catch (error) {
					console.error("Error parsing auth event:", error);
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, [router]);

	// 初始化认证状态
	useEffect(() => {
		const initAuth = async () => {
			setLoading(true);
			const currentUser = await checkAuth();
			setLoading(false);

			// 路由保护逻辑
			if (currentUser) {
				// 用户已登录
				if (pathname === "/login" || pathname === "/register") {
					// 已登录用户访问登录/注册页面，重定向到仪表盘
					router.replace("/dashboard");
				}
				// 广播登录事件到其他标签页
				localStorage.setItem(
					"auth-event",
					JSON.stringify({
						type: "login",
						timestamp: Date.now(),
					}),
				);
			} else {
				// 用户未登录
				if (isProtectedRoute(pathname)) {
					// 未登录用户访问受保护页面，重定向到登录页
					router.replace("/login");
				}
			}
		};

		initAuth();
	}, [pathname, router, checkAuth, isProtectedRoute]);

	const isAuthenticated = !!user;

	const value: AuthContextType = {
		user,
		loading,
		login,
		logout,
		refreshUser,
		isAuthenticated,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

// 认证守卫组件
export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (!loading) {
			// 如果用户已登录但在登录/注册页面，重定向到仪表盘
			if (user && (pathname === "/login" || pathname === "/register")) {
				router.replace("/dashboard");
			}
		}
	}, [user, loading, pathname, router]);

	// 如果正在加载，显示加载状态
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">加载中...</p>
				</div>
			</div>
		);
	}

	// 如果用户已登录但在登录/注册页面，不渲染内容（等待重定向）
	if (user && (pathname === "/login" || pathname === "/register")) {
		return null;
	}

	return <>{children}</>;
}
