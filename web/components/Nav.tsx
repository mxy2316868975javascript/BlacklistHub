"use client";
import Link from "next/link";
import { Layout, Menu, message, Avatar, Dropdown } from "antd";
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

  const selectedKey = useMemo(() => {
    if (pathname?.startsWith("/blacklist")) return "blacklist";
    if (pathname?.startsWith("/dashboard")) return "dashboard";
    return undefined;
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

  return (
    <Layout.Header className="flex items-center justify-between gap-4">
      <div className="text-white font-semibold">Blacklist Hub</div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={[
          { key: "dashboard", label: <Link href="/dashboard">仪表盘</Link> },
          { key: "blacklist", label: <Link href="/blacklist">黑名单</Link> },
        ]}
      />
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
            <span className="text-white/80">{username || "用户"}</span>
          </div>
        </Dropdown>
      </div>
    </Layout.Header>
  );
}

