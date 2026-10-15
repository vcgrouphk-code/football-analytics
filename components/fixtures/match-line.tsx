import Link from "next/link";
import { MatchPick } from "@/components/fixtures/match-pick";
import { HkjcTag } from "@/components/fixtures/hkjc-tag";
import { TeamCrest } from "@/components/teams/team-crest";
import { hkjcOnSale } from "@/lib/football/hkjc";
import type { WinChances } from "@/lib/stats/briefing";
import type { FixtureWithRelations } from "@/types/football";

function kickoffParts(iso: string) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("zh-Hant", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const day = new Intl.DateTimeFormat("zh-Hant", {
    timeZone: "Asia/Hong_Kong",
    month: "numeric",
    day: "numeric",
  }).format(date);
  return { time, day };
}

function centerOf(fixture: FixtureWithRelations, showDate: boolean) {
  const { time, day } = kickoffParts(fixture.kickoffAt);
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;
  const score = hasScore ? `${fixture.homeScore} - ${fixture.awayScore}` : null;
  const dateLabel = showDate ? day : null;

  if (fixture.status === "finished" && score) {
    return { primary: score, tone: "score" as const, secondary: dateLabel };
  }
  if (fixture.status === "live") {
    return {
      primary: score ?? time,
      tone: "live" as const,
      secondary: dateLabel ? `進行中 · ${dateLabel}` : "進行中",
    };
  }
  if (fixture.status === "postponed") {
    return { primary: "延期", tone: "muted" as const, secondary: dateLabel ?? time };
  }
  if (fixture.status === "cancelled") {
    return { primary: "取消", tone: "muted" as const, secondary: dateLabel ?? time };
  }
  return { primary: time, tone: "time" as const, secondary: dateLabel };
}

const toneClass = {
  score: "text-base font-semibold text-white",
  live: "text-base font-semibold text-emerald-400",
  time: "text-xs font-medium text-zinc-500",
  muted: "text-xs font-medium text-zinc-500",
};

export function MatchLine({
  fixture,
  showDate = false,
  chances,
  pickable = false,
}: {
  fixture: FixtureWithRelations;
  showDate?: boolean;
  chances?: WinChances;
  pickable?: boolean;
}) {
  const center = centerOf(fixture, showDate);
  const homeLead = chances != null && chances.home >= chances.away + 12;
  const awayLead = chances != null && chances.away >= chances.home + 12;
  const hkjc = hkjcOnSale(fixture.homeTeam.name, fixture.awayTeam.name);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 transition hover:border-zinc-600 hover:bg-zinc-900">
    <Link
      href={`/fixtures/${fixture.id}`}
      className="block"
    >
      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_4.5rem_minmax(0,1fr)_1.25rem] items-center gap-2">
        <TeamCrest team={fixture.homeTeam} />
        <p className="truncate text-right text-sm font-medium text-zinc-100">
          {fixture.homeTeam.name}
        </p>
        <div className="text-center">
          <p className={`tabular-nums ${toneClass[center.tone]}`}>{center.primary}</p>
          {center.secondary && (
            <p
              className={`text-[10px] ${
                center.tone === "live" ? "text-emerald-400" : "text-zinc-600"
              }`}
            >
              {center.secondary}
            </p>
          )}
        </div>
        <p className="truncate text-sm font-medium text-zinc-100">
          {fixture.awayTeam.name}
        </p>
        <TeamCrest team={fixture.awayTeam} />
      </div>
      {chances && (
        <p
          className="mt-1.5 text-center text-[11px] tabular-nums text-zinc-500"
          title="依本季進失球估算，用來比較兩隊實力，不是博彩賠率"
        >
          <span className="mr-1.5 text-zinc-600">估算</span>
          <span className={homeLead ? "font-medium text-emerald-400" : undefined}>
            主 {chances.home}%
          </span>
          <span className="mx-1.5 text-zinc-700">·</span>
          和 {chances.draw}%
          <span className="mx-1.5 text-zinc-700">·</span>
          <span className={awayLead ? "font-medium text-sky-400" : undefined}>
            客 {chances.away}%
          </span>
          {hkjc && (
            <span className="ml-2">
              <HkjcTag />
            </span>
          )}
        </p>
      )}
      {!chances && hkjc && (
        <p className="mt-1.5 text-center">
          <HkjcTag />
        </p>
      )}
    </Link>
    {pickable && (
      <MatchPick
        fixtureId={fixture.id}
        homeName={fixture.homeTeam.name}
        awayName={fixture.awayTeam.name}
        status={fixture.status}
        homeScore={fixture.homeScore}
        awayScore={fixture.awayScore}
      />
    )}
    </div>
  );
}
