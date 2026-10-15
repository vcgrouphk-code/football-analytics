import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/dashboard", label: "總覽" },
  { href: "/leagues", label: "聯賽" },
  { href: "/login", label: "登入" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="shrink-0 text-base font-semibold text-emerald-400">
          PitchMetrics
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm",
                isActive(pathname, link.href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-6 md:flex">
        <Link href="/" className="mb-8 block">
          <span className="text-lg font-semibold tracking-tight text-emerald-400">
            PitchMetrics
          </span>
          <span className="mt-1 block text-xs text-zinc-500">足球專業分析</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(pathname, link.href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
