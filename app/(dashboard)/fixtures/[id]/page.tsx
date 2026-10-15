import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { AnalysisList } from "@/components/fixtures/analysis-list";
import { XgComparison } from "@/components/charts/xg-comparison";
import { getFixture, getMatchAnalysis } from "@/lib/data/queries";
import type { FixtureStats } from "@/types/football";

export default function FixtureDetailPage({
  params,
}: PageProps<"/fixtures/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">載入賽事…</p>}>
      <FixtureDetailContent params={params} />
    </Suspense>
  );
}

async function FixtureDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixture = await getFixture(id);
  if (!fixture) notFound();
  const points = await getMatchAnalysis(fixture);

  const kickoff = format(new Date(fixture.kickoffAt), "yyyy年M月d日 HH:mm", {
    locale: zhTW,
  });

  const stats = fixture.stats;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href={`/leagues/${fixture.league.id}`} className="hover:text-emerald-400">
            {fixture.league.name}
          </Link>
          {fixture.round ? ` · ${fixture.round}` : ""}
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {fixture.homeTeam.name}{" "}
          <span className="text-zinc-500">
            {fixture.homeScore != null && fixture.awayScore != null
              ? `${fixture.homeScore} - ${fixture.awayScore}`
              : "vs"}
          </span>{" "}
          {fixture.awayTeam.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {kickoff}
          {fixture.venue ? ` · ${fixture.venue}` : ""}
        </p>
      </div>

      <AnalysisList points={points} />

      {hasRecordedStats(stats) && stats && (
        <>
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
              期望進球 (xG)
            </h2>
            <XgComparison
              homeLabel={fixture.homeTeam.shortName ?? fixture.homeTeam.name}
              awayLabel={fixture.awayTeam.shortName ?? fixture.awayTeam.name}
              homeXg={stats.homeXg ?? 0}
              awayXg={stats.awayXg ?? 0}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <MetricBlock
              title="射門"
              home={stats.homeShots}
              away={stats.awayShots}
            />
            <MetricBlock
              title="射正"
              home={stats.homeShotsOnTarget}
              away={stats.awayShotsOnTarget}
            />
            <MetricBlock
              title="控球 (%)"
              home={stats.homePossession}
              away={stats.awayPossession}
            />
            <MetricBlock
              title="角球"
              home={stats.homeCorners}
              away={stats.awayCorners}
            />
          </section>
        </>
      )}

      <div className="flex gap-4 text-sm">
        <Link
          href={`/teams/${fixture.homeTeam.id}`}
          className="text-emerald-400 hover:underline"
        >
          {fixture.homeTeam.name} 球隊頁
        </Link>
        <Link
          href={`/teams/${fixture.awayTeam.id}`}
          className="text-emerald-400 hover:underline"
        >
          {fixture.awayTeam.name} 球隊頁
        </Link>
      </div>
    </div>
  );
}

function hasRecordedStats(stats: FixtureStats | null | undefined) {
  if (!stats) return false;
  return Object.values(stats).some((value) => value != null);
}

function MetricBlock({
  title,
  home,
  away,
}: {
  title: string;
  home: number | null | undefined;
  away: number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums">
        {home ?? "—"}{" "}
        <span className="text-zinc-600">|</span> {away ?? "—"}
      </p>
    </div>
  );
}
