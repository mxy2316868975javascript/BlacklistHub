import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";

const NavClient = dynamic(() => import("./NavClient"), { ssr: false });

export default async function NavServer() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const payload = verifyToken<{
		username: string;
		role?: "reporter" | "reviewer" | "admin";
	}>(token);
	const username = payload?.username || "";
	const role = (payload?.role || "reporter") as
		| "reporter"
		| "reviewer"
		| "admin";

	return <NavClient username={username} role={role} />;
}
