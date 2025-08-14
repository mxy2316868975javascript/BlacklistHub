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
import { type GuestSession, useGuestSession } from "./useGuestSession";

interface AuthContextType {
	user: UserInfo | null;
	loading: boolean;
	isGuest: boolean;
	guestSession: GuestSession | null;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
	enterGuestMode: () => void;
	exitGuestMode: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [isGuest, setIsGuest] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	// 集成游客会话管理
	const guestSessionHook = useGuestSession();
	const { session: guestSession } = guestSessionHook;

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
			}
			setUser(null);
			return null;
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
			setIsGuest(false);
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

	// 进入游客模式
	const enterGuestMode = useCallback(() => {
		setIsGuest(true);
		setUser(null);
		// 广播游客模式事件到其他标签页
		localStorage.setItem(
			"auth-event",
			JSON.stringify({
				type: "enter_guest",
				timestamp: Date.now(),
			}),
		);
	}, []);

	// 退出游客模式
	const exitGuestMode = useCallback(() => {
		setIsGuest(false);
		guestSessionHook.resetSession();
		// 广播退出游客模式事件到其他标签页
		localStorage.setItem(
			"auth-event",
			JSON.stringify({
				type: "exit_guest",
				timestamp: Date.now(),
			}),
		);
	}, [guestSessionHook]);

	// 监听其他标签页的认证状态变化
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "auth-event" && e.newValue) {
				try {
					const event = JSON.parse(e.newValue);
					if (event.type === "logout") {
						setUser(null);
						setIsGuest(false);
						router.push("/login");
					} else if (event.type === "login") {
						setIsGuest(false);
						checkAuth();
					} else if (event.type === "enter_guest") {
						setIsGuest(true);
						setUser(null);
					} else if (event.type === "exit_guest") {
						setIsGuest(false);
					}
				} catch (error) {
					console.error("Error parsing auth event:", error);
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, [router, checkAuth]);

	// 初始化认证状态
	useEffect(() => {
		const initAuth = async () => {
			setLoading(true);
			const currentUser = await checkAuth();
			setLoading(false);

			// 路由保护逻辑
			if (currentUser) {
				// 用户已登录
				setIsGuest(false);
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
				// 用户未登录，检查是否应该进入游客模式
				if (
					pathname === "/" ||
					pathname.startsWith("/blacklist/public") ||
					pathname.startsWith("/help")
				) {
					// 进入游客模式
					setIsGuest(true);
				} else if (isProtectedRoute(pathname)) {
					// 未登录用户访问受保护页面，重定向到登录页
					setIsGuest(false);
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
		isGuest,
		guestSession,
		login,
		logout,
		refreshUser,
		enterGuestMode,
		exitGuestMode,
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
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
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
