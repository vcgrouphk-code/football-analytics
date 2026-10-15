"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { SetupBanner } from "@/components/layout/setup-banner";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SetupBanner />
      <div className="flex min-w-0 flex-1 flex-col md:flex-row">
        <Sidebar pathname={pathname} />
        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
