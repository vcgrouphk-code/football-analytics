import { getLatestSyncAt } from "@/lib/data/sync-status";
import { syncTrackedFootballData } from "@/lib/football/sync-football-data";
import { hasFootballDataToken, isSupabaseConfigured } from "@/lib/utils/env";

const INTERVAL_MS = 15 * 60 * 1000;

const scheduleState = globalThis as typeof globalThis & {
  __pitchmetricsSyncStarted?: boolean;
};

function logSyncFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`scheduled sync failed: ${message}`);
}

/** 伺服器行程內每 15 分鐘更新已追蹤聯賽。上次同步已超過間隔時，啟動後立刻補一次。 */
export function startSyncSchedule() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (!hasFootballDataToken() || !isSupabaseConfigured()) return;
  if (scheduleState.__pitchmetricsSyncStarted) return;
  scheduleState.__pitchmetricsSyncStarted = true;

  const tick = () => {
    void syncTrackedFootballData().catch(logSyncFailure);
  };

  void (async () => {
    const latest = await getLatestSyncAt();
    const stale = !latest || Date.now() - new Date(latest).getTime() >= INTERVAL_MS;
    if (stale) tick();
  })().catch(logSyncFailure);

  setInterval(tick, INTERVAL_MS);
}
