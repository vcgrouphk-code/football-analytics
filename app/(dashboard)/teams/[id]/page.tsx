import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FixtureRow } from "@/components/fixtures/fixture-row";
import { FormBadge } from "@/components/teams/form-badge";
import { getTeamSnapshot } from "@/lib/data/queries";

export default function TeamDetailPage({
  params,
}: PageProps<"/teams/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">載入球隊…</p>}>
      <TeamDetailContent params={params} />
    </Suspense>
  );
}

async function TeamDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await getTeamSnapshot(id);
  if (!snapshot) notFound();

  const { team, league, form, recentFixtures } = snapshot;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href={`/leagues/${league.id}`} className="hover:text-emerald-400">
            {league.name}
          </Link>{" "}
          · {league.season}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{team.name}</h1>
        <p className="mt-1 text-xs text-zinc-500">戰績與近況只計 {league.name}</p>
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            近 5 場
          </p>
          <FormBadge form={form} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="場次" value={snapshot.played} />
        <MiniStat
          label="戰績"
          value={`${snapshot.wins}W ${snapshot.draws}D ${snapshot.losses}L`}
        />
        <MiniStat
          label="進/失球"
          value={`${snapshot.goalsFor} / ${snapshot.goalsAgainst}`}
        />
        {(snapshot.xgFor > 0 || snapshot.xgAgainst > 0) && (
          <MiniStat
            label="xG 差"
            value={(snapshot.xgFor - snapshot.xgAgainst).toFixed(2)}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          近期比賽
        </h2>
        <div className="space-y-2">
          {recentFixtures.map((f) => (
            <FixtureRow key={f.id} fixture={f} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
