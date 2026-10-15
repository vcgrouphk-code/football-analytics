import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { FixtureWithRelations } from "@/types/football";

const statusLabel: Record<string, string> = {
  scheduled: "未開賽",
  live: "進行中",
  finished: "已結束",
  postponed: "延期",
  cancelled: "取消",
};

export function FixtureRow({
  fixture,
  showLeague = true,
}: {
  fixture: FixtureWithRelations;
  showLeague?: boolean;
}) {
  const kickoff = format(new Date(fixture.kickoffAt), "M月d日 HH:mm", {
    locale: zhTW,
  });

  const score =
    fixture.homeScore != null && fixture.awayScore != null
      ? `${fixture.homeScore} - ${fixture.awayScore}`
      : "vs";

  return (
    <Link
      href={`/fixtures/${fixture.id}`}
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 transition hover:border-zinc-600 hover:bg-zinc-900 sm:gap-4 sm:px-4"
    >
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-medium text-zinc-100 sm:text-base">
          {fixture.homeTeam.name}
        </p>
        {showLeague && (
          <p className="truncate text-xs text-zinc-500">{fixture.league.name}</p>
        )}
      </div>
      <div className="px-1 text-center">
        <p className="text-base font-semibold tabular-nums text-white sm:text-lg">
          {score}
        </p>
        <p className="text-xs text-zinc-500">{kickoff}</p>
        <p className="text-[10px] uppercase tracking-wide text-zinc-600">
          {statusLabel[fixture.status] ?? fixture.status}
        </p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100 sm:text-base">
          {fixture.awayTeam.name}
        </p>
        {fixture.stats && fixture.status === "finished" && (
          <p className="text-xs text-emerald-500/90">
            xG {fixture.stats.homeXg?.toFixed(2)} —{" "}
            {fixture.stats.awayXg?.toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}
