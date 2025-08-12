import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Blacklist Hub</h1>
        <p className="text-neutral-500">黑名单录入与管理平台</p>
        <div className="flex gap-4 justify-center">
          <Link className="text-blue-600 underline" href="/login">前往登录</Link>
          <Link className="text-blue-600 underline" href="/dashboard">查看仪表盘</Link>
          <Link className="text-blue-600 underline" href="/blacklist">管理黑名单</Link>
        </div>
      </div>
    </main>
  );
}
