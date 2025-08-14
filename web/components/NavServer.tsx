import dynamic from "next/dynamic";

const NavClient = dynamic(() => import("./NavClient"), { ssr: false });

export default async function NavServer() {
	return <NavClient />;
}
