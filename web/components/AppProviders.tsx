"use client";
import { App as AntdApp, ConfigProvider, Layout } from "antd";
import { usePathname } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Nav from "@/components/Nav";

export default function AppProviders({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const hideNav = pathname === "/login" || pathname === "/register";
	return (
		<ConfigProvider>
			<AntdApp>
				<Layout>
					{!hideNav && <Nav />}
					{!hideNav && <Breadcrumbs />}
					<Layout.Content style={{ padding: 0, minHeight: "100vh" }}>
						{children}
					</Layout.Content>
				</Layout>
			</AntdApp>
		</ConfigProvider>
	);
}
