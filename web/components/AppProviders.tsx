"use client";
import { ConfigProvider, App as AntdApp, Layout } from "antd";
import Nav from "@/components/Nav";
import Breadcrumbs from "@/components/Breadcrumbs";
import { usePathname } from "next/navigation";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login" || pathname === "/register";
  return (
    <ConfigProvider>
      <AntdApp>
        <Layout>
          {!hideNav && <Nav />}
          {!hideNav && <Breadcrumbs />}
          <Layout.Content style={{ padding: 0, minHeight: "100vh" }}>{children}</Layout.Content>
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}

