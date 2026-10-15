import { Suspense } from "react";
import Link from "next/link";
import { listLeagues } from "@/lib/data/queries";

export default function LeaguesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">載入聯賽…</p>}>
      <LeaguesContent />
    </Suspense>
  );
}

async function LeaguesContent() {
  const leagues = (await listLeagues()).sort((a, b) =>
    a.name.localeCompare(b.name, "zh-Hant"),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">聯賽</h1>
      <ul className="space-y-3">
        {leagues.map((league) => (
          <li key={league.id}>
            <Link
              href={`/leagues/${league.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 hover:border-zinc-600"
            >
              <div>
                <p className="font-medium">{league.name}</p>
                <p className="text-sm text-zinc-500">
                  {league.country} · {league.season}
                </p>
              </div>
              <span className="text-zinc-500">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
