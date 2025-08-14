"use client";
import { Avatar, Dropdown, message } from "antd";
import axios from "axios";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { UserInfo, UserRole } from "@/types/user";
import { PERMISSIONS } from "@/types/user";

type Props = {
	username?: string;
	role?: UserRole | "";
	userInfo?: UserInfo; // 从 /api/userinfo 获取的用户信息
};

export default function NavClient({
	username = "",
	role = "",
	userInfo,
}: Props) {
	const pathname = usePathname();
	const [name, setName] = useState(username);
	const [userRole, setUserRole] = useState(role);

	useEffect(() => {
		// 优先使用 userInfo，然后是 props，最后是默认值
		if (userInfo) {
			setName(userInfo.username);
			setUserRole(userInfo.role);
		} else {
			setName(username || "");
			setUserRole(role || "");
		}
	}, [username, role, userInfo]);

	useEffect(() => {
		// 客户端兜底：若没有服务端注入的 props，则尝试 /api/userinfo 获取，避免 SSR/CSR 不一致
		if (!name) {
			(async () => {
				try {
					const res = await axios.get("/api/userinfo");
					setName(res.data?.user?.username || "");
					setUserRole(res.data?.user?.role || "");
				} catch {}
			})();
		}
	}, [name]);

	const current = useMemo(() => {
		if (pathname?.startsWith("/dashboard")) return "dashboard";
		if (pathname?.startsWith("/blacklist")) return "blacklist";
		if (pathname?.startsWith("/defaulters")) return "defaulters";
		if (pathname?.startsWith("/contributors")) return "contributors";
		if (pathname?.startsWith("/rankings")) return "rankings";
		if (pathname?.startsWith("/users")) return "users";
		if (pathname?.startsWith("/admin/users")) return "admin-users";
		return "";
	}, [pathname]);

	const linkCls = (key: string) =>
		`inline-flex items-center h-10 px-3 text-sm font-medium no-underline border-b-2 ${
			current === key
				? "!text-neutral-900 border-blue-600"
				: "!text-neutral-600 hover:!text-neutral-900 border-transparent"
		}`;

	const logout = async () => {
		await axios.post("/api/auth/logout");
		message.success("已退出");
		window.location.href = "/login";
	};

	return (
		<header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-100">
			<div className="px-6 mx-auto h-14 flex items-center justify-between">
				{/* Brand */}
				<Link href="/" className="flex items-center gap-2">
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-semibold">
						B
					</span>
					<span className="text-neutral-900 font-semibold tracking-tight">
						Blacklist Hub
					</span>
				</Link>

				{/* Center Nav - Underline style */}
				<nav className="hidden md:flex items-center gap-4">
					<Link
						href="/dashboard"
						className={linkCls("dashboard")}
						prefetch={false}
					>
						仪表盘
					</Link>
					<Link
						href="/blacklist"
						className={linkCls("blacklist")}
						prefetch={false}
					>
						黑名单
					</Link>
					<Link
						href="/defaulters"
						className={linkCls("defaulters")}
						prefetch={false}
					>
						失信名单
					</Link>
					<Link
						href="/contributors"
						className={linkCls("contributors")}
						prefetch={false}
					>
						贡献者
					</Link>
					<Link
						href="/rankings"
						className={linkCls("rankings")}
						prefetch={false}
					>
						排名
					</Link>
					{userRole &&
						PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(userRole as UserRole) && (
							<Link href="/users" className={linkCls("users")} prefetch={false}>
								用户列表
							</Link>
						)}
					{userRole &&
						PERMISSIONS.CAN_ACCESS_USER_MANAGEMENT(userRole as UserRole) && (
							<Link
								href="/admin/users"
								className={linkCls("admin-users")}
								prefetch={false}
							>
								角色管理
							</Link>
						)}
				</nav>

				{/* Actions */}
				<div className="flex items-center gap-3">
					<Dropdown
						menu={{
							items: [
								{
									key: "profile",
									label: <Link href="/dashboard">个人中心</Link>,
								},
								{ type: "divider" as const },
								{
									key: "logout",
									label: (
										<button
											type="button"
											onClick={logout}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													logout();
												}
											}}
											className="border-none bg-transparent p-0 cursor-pointer text-inherit font-inherit"
										>
											退出登录
										</button>
									),
								},
							],
						}}
					>
						<div className="flex items-center gap-2 cursor-pointer select-none">
							<Avatar size="small">{name?.[0]?.toUpperCase() || "U"}</Avatar>
							<span className="text-neutral-700">{name || "用户"}</span>
						</div>
					</Dropdown>
				</div>
			</div>
		</header>
	);
}
