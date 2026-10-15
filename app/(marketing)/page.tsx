import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold text-emerald-400">
          PitchMetrics
        </span>
        <Link
          href="/dashboard"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          進入分析台
        </Link>
      </header>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-12">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          以數據驅動的足球專業分析平台
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          Next.js、TypeScript 與 Supabase 建構。整合賽事、xG
          與近況表現，從單場深度報告到球隊賽季總覽，協助你做出更清晰的賽前判斷。
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { title: "單場深度", desc: "射門、控球、xG 與對賽脈絡" },
            { title: "球隊近況", desc: "Form、進失球與期望進球趨勢" },
            { title: "可擴充同步", desc: "API 排程寫入 Postgres，RLS 安全讀取" },
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <h2 className="font-semibold text-emerald-400">{item.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
