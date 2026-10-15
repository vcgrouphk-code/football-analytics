import { Suspense } from "react";
import { connection } from "next/server";
import { TodayBoard } from "@/components/fixtures/today-board";
import { getLatestSyncAt } from "@/lib/data/sync-status";
import { listTodayFixtures, winChancesByFixture } from "@/lib/data/queries";
import { formatHongKongTime } from "@/lib/football/dashboard-view";
import { startSyncSchedule } from "@/lib/football/sync-schedule";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">載入賽事中心…</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();
  startSyncSchedule();
  const now = new Date();
  const [today, updatedAt] = await Promise.all([
    listTodayFixtures(now),
    getLatestSyncAt(),
  ]);
  const chances = await winChancesByFixture(today.fixtures);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">賽事中心</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {today.label}
            <span className="ml-2 text-zinc-500">{today.fixtures.length} 場</span>
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          比分可能延遲
          {updatedAt ? ` · 最後更新 ${formatHongKongTime(updatedAt)}` : ""}
        </p>
      </div>

      <section id="today" className="space-y-4">
        <h2 className="text-sm font-medium tracking-wide text-zinc-400">今日賽事</h2>
        <TodayBoard fixtures={today.fixtures} now={now.getTime()} chances={chances} />
      </section>
    </div>
  );
}
