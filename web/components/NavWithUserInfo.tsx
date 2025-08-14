import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import type { UserInfo } from "@/types/user";
import NavClient from "./NavClient";

// 服务器端获取用户信息的函数
async function getUserInfo(): Promise<UserInfo | null> {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) return null;

		const payload = verifyToken<UserInfo>(token);
		if (!payload) return null;

		return {
			uid: payload.uid,
			username: payload.username,
			role: payload.role || "reporter",
		};
	} catch (error) {
		console.error("获取用户信息失败:", error);
		return null;
	}
}

// 这是一个服务器端组件，展示如何使用从服务器端获取的用户信息
export default async function NavWithUserInfo() {
	const userInfo = await getUserInfo();

	return <NavClient userInfo={userInfo || undefined} />;
}

// 使用示例：
// 在你的页面或布局中，你可以这样使用：
//
// import NavWithUserInfo from "@/components/NavWithUserInfo";
//
// export default function Layout({ children }: { children: React.ReactNode }) {
//   return (
//     <div>
//       <NavWithUserInfo />
//       {children}
//     </div>
//   );
// }
