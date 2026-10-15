import { MatchLine } from "@/components/fixtures/match-line";
import { HkjcTag } from "@/components/fixtures/hkjc-tag";
import { TodayPicks } from "@/components/fixtures/match-pick";
import { groupByLeague, splitToday } from "@/lib/football/dashboard-view";
import { hkjcOnSale } from "@/lib/football/hkjc";
import type { WinChances } from "@/lib/stats/briefing";
import type { FixtureWithRelations } from "@/types/football";

function LeagueGroups({
  fixtures,
  chances,
}: {
  fixtures: FixtureWithRelations[];
  chances: Record<string, WinChances>;
}) {
  return (
    <div className="space-y-1">
      {groupByLeague(fixtures).map((group) => (
        <details key={group.league.id} className="group/league space-y-1.5">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-1.5 text-sm font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
            <span className="text-zinc-600 transition group-open/league:rotate-90">›</span>
            {group.league.name}
            <span className="font-normal text-zinc-600">{group.fixtures.length} 場</span>
            {group.fixtures.some((fixture) =>
              hkjcOnSale(fixture.homeTeam.name, fixture.awayTeam.name),
            ) && <HkjcTag />}
          </summary>
          <div className="space-y-1.5 pb-2">
            {group.fixtures.map((fixture) => (
              <MatchLine
                key={fixture.id}
                fixture={fixture}
                chances={chances[fixture.id]}
                pickable
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function StatusHeading({
  title,
  count,
  live = false,
}: {
  title: string;
  count: number;
  live?: boolean;
}) {
  return (
    <h3 className={`text-sm font-medium ${live ? "text-emerald-400" : "text-zinc-300"}`}>
      {title}
      <span className="ml-2 font-normal text-zinc-600">{count} 場</span>
    </h3>
  );
}

export function TodayBoard({
  fixtures,
  now,
  chances,
}: {
  fixtures: FixtureWithRelations[];
  now: number;
  chances: Record<string, WinChances>;
}) {
  if (!fixtures.length) {
    return <p className="text-sm text-zinc-500">今天沒有賽事。</p>;
  }

  const groups = splitToday(fixtures, now);

  return (
    <TodayPicks fixtures={fixtures}>
    <div className="space-y-6">
      {groups.live.length > 0 && (
        <section className="space-y-3">
          <StatusHeading title="進行中" count={groups.live.length} live />
          <LeagueGroups fixtures={groups.live} chances={chances} />
        </section>
      )}
      {groups.awaiting.length > 0 && (
        <section className="space-y-3">
          <StatusHeading title="已開球" count={groups.awaiting.length} />
          <LeagueGroups fixtures={groups.awaiting} chances={chances} />
        </section>
      )}
      {groups.upcoming.length > 0 && (
        <section className="space-y-3">
          <StatusHeading title="稍後" count={groups.upcoming.length} />
          <LeagueGroups fixtures={groups.upcoming} chances={chances} />
        </section>
      )}
      {groups.other.length > 0 && (
        <section className="space-y-3">
          <StatusHeading title="延期或取消" count={groups.other.length} />
          <LeagueGroups fixtures={groups.other} chances={chances} />
        </section>
      )}
      {groups.finished.length > 0 && (
        <details className="group/finished space-y-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-medium text-zinc-400 [&::-webkit-details-marker]:hidden">
            <span className="text-zinc-600 transition group-open/finished:rotate-90">›</span>
            已結束
            <span className="font-normal text-zinc-600">{groups.finished.length} 場</span>
          </summary>
          <LeagueGroups fixtures={groups.finished} chances={chances} />
        </details>
      )}
    </div>
    </TodayPicks>
  );
}
