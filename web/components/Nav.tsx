import dynamic from "next/dynamic";

const NavClient = dynamic(() => import("./NavClient"), { ssr: false });

export default function Nav() {
	return <NavClient />;
}
