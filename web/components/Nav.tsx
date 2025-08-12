"use client";
import Link from "next/link";
import { message, Avatar, Dropdown } from "antd";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [username, setUsername] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/me");
        setUsername(res.data?.user?.username || "");
      } catch {
        setUsername("");
      }
    })();
  }, []);

  const current = useMemo(() => {
    if (pathname?.startsWith("/blacklist")) return "blacklist";
    if (pathname?.startsWith("/dashboard")) return "dashboard";
    return "";
  }, [pathname]);

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      message.success("已退出");
      window.location.href = "/login";
    } catch {
      message.error("退出失败");
    }
  };

  const linkCls = (key: string) =>
    `inline-flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      current === key
        ? "!text-[#fff] !bg-[#1677ff] !hover:bg-blue-100"
        : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur">
      <div className="max-w-screen-xl mx-auto h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white text-xs">B</span>
          <span className="text-neutral-900 font-semibold">Blacklist Hub</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/dashboard" className={linkCls("dashboard")} prefetch={false}>
            仪表盘
          </Link>
          <Link href="/blacklist" className={linkCls("blacklist")} prefetch={false}>
            黑名单
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Dropdown
            menu={{
              items: [
                { key: "profile", label: <Link href="/dashboard">个人中心</Link> },
                { type: "divider" as const },
                { key: "logout", label: <span onClick={logout}>退出登录</span> },
              ],
            }}
          >
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <Avatar size="small">{username?.[0]?.toUpperCase() || "U"}</Avatar>
              <span className="text-neutral-700">{username || "用户"}</span>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

