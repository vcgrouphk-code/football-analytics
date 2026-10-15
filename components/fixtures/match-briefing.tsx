import type { ReactNode } from "react";
import Link from "next/link";
import { FormBadge } from "@/components/teams/form-badge";
import { TeamCrest } from "@/components/teams/team-crest";
import type { MatchBriefing, SideBrief } from "@/lib/stats/briefing";
import type { FixtureWithRelations } from "@/types/football";

function perGame(goals: number, played: number) {
  if (!played) return "—";
  return (goals / played).toFixed(1);
}

function restLabel(days: number | null) {
  if (days == null) return "本季首場";
  if (days <= 0) return "同日";
  return `${days} 天`;
}

function SideHeading({ side }: { side: SideBrief }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <TeamCrest team={side.team} className="h-6 w-6" />
      <p className="w-full truncate text-sm font-medium">{side.team.name}</p>
    </div>
  );
}

function Metric({
  label,
  home,
  away,
}: {
  label: ReactNode;
  home: ReactNode;
  away: ReactNode;
}) {
  return (
    <>
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="flex justify-center text-sm tabular-nums">{home}</div>
      <div className="flex justify-center text-sm tabular-nums">{away}</div>
    </>
  );
}

function meetingKickoff(iso: string) {
  return new Intl.DateTimeFormat("zh-Hant", {
    timeZone: "Asia/Hong_Kong",
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

function Meeting({ fixture }: { fixture: FixtureWithRelations }) {
  return (
    <Link
      href={`/fixtures/${fixture.id}`}
      className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm"
    >
      <span className="text-xs text-zinc-500">{meetingKickoff(fixture.kickoffAt)}</span>
      <span className="truncate text-right">{fixture.homeTeam.name}</span>
      <span className="font-semibold tabular-nums">
        {fixture.homeScore} - {fixture.awayScore}
      </span>
      <span className="truncate">{fixture.awayTeam.name}</span>
    </Link>
  );
}

function ChanceRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-zinc-400">{label}</span>
        <span className="tabular-nums text-zinc-200">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Commentary({ briefing }: { briefing: MatchBriefing }) {
  const { home, away, nature, chances, comment } = briefing;
  return (
    <div className="space-y-3 rounded-lg bg-zinc-950/70 p-3">
      <p className="text-xs font-medium text-emerald-400">{nature.kind}</p>
      <p className="text-sm leading-relaxed text-zinc-200">{comment}</p>
      {chances && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-wide text-zinc-500">估算</p>
          <ChanceRow label={`${home.team.name}勝`} value={chances.home} tone="bg-emerald-500" />
          <ChanceRow label="和" value={chances.draw} tone="bg-zinc-500" />
          <ChanceRow label={`${away.team.name}勝`} value={chances.away} tone="bg-sky-500" />
          <p className="text-[11px] leading-relaxed text-zinc-500">
            機會率依本季進失球估算，用來比較兩隊實力，不是博彩賠率。
          </p>
        </div>
      )}
    </div>
  );
}

export function MatchBriefingView({ briefing }: { briefing: MatchBriefing }) {
  const { home, away, meetings } = briefing;

  return (
    <>
      <p className="text-[11px] font-medium tracking-wide text-zinc-500">紀錄</p>
      <div className="grid grid-cols-[5.25rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3 gap-y-3">
        <span />
        <SideHeading side={home} />
        <SideHeading side={away} />
        <Metric
          label="排名"
          home={home.rank ?? "—"}
          away={away.rank ?? "—"}
        />
        <Metric label="積分" home={home.points} away={away.points} />
        <Metric
          label="場均進/失"
          home={`${perGame(home.goalsFor, home.played)} / ${perGame(home.goalsAgainst, home.played)}`}
          away={`${perGame(away.goalsFor, away.played)} / ${perGame(away.goalsAgainst, away.played)}`}
        />
        <Metric
          label="近況"
          home={
            <span className="flex flex-col items-center gap-1">
              <FormBadge form={home.form} emptyLabel="—" />
              <span className="text-[10px] text-zinc-600">主場</span>
            </span>
          }
          away={
            <span className="flex flex-col items-center gap-1">
              <FormBadge form={away.form} emptyLabel="—" />
              <span className="text-[10px] text-zinc-600">客場</span>
            </span>
          }
        />
        <Metric
          label={
            <>
              休息
              <span className="mt-0.5 block text-[10px] leading-tight text-zinc-600">
                已同步賽事
              </span>
            </>
          }
          home={restLabel(home.restDays)}
          away={restLabel(away.restDays)}
        />
      </div>
      <Commentary briefing={briefing} />
      <div className="space-y-2 border-t border-zinc-800 pt-3">
        <h3 className="text-xs font-medium text-zinc-500">交手紀錄</h3>
        {meetings.length === 0 ? (
          <p className="text-sm text-zinc-500">本季尚未交手。</p>
        ) : (
          meetings.map((fixture) => <Meeting key={fixture.id} fixture={fixture} />)
        )}
      </div>
    </>
  );
}
