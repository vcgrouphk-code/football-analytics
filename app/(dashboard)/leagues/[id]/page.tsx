import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FixtureRow } from "@/components/fixtures/fixture-row";
import { StandingsTable } from "@/components/leagues/standings-table";
import { listFixturesByLeague, listLeagues } from "@/lib/data/queries";
import { currentRoundLabel } from "@/lib/football/dashboard-view";
import { buildTable } from "@/lib/stats/table";

export default function LeagueDetailPage({
  params,
}: PageProps<"/leagues/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">載入聯賽…</p>}>
      <LeagueDetailContent params={params} />
    </Suspense>
  );
}

async function LeagueDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leagues = await listLeagues();
  const league = leagues.find((l) => l.id === id);
  if (!league) notFound();

  const fixtures = await listFixturesByLeague(id);
  const round = currentRoundLabel(fixtures);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{league.name}</h1>
        <p className="text-sm text-zinc-500">
          {[league.country, `賽季 ${league.season}`, round].filter(Boolean).join(" · ")}
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">積分榜</h2>
        <StandingsTable rows={buildTable(fixtures)} />
      </section>
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-400">賽程</h2>
        {fixtures.length === 0 ? (
          <p className="text-sm text-zinc-500">此聯賽尚無賽事資料。</p>
        ) : (
          fixtures.map((f) => <FixtureRow key={f.id} fixture={f} />)
        )}
      </div>
    </div>
  );
}
