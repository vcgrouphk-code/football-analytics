import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

function DashboardFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <div className="hidden w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 md:block" />
      <main className="min-w-0 flex-1 p-4 md:p-8">{/* streaming */}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
