import Link from "next/link";
import { FormBadge } from "@/components/teams/form-badge";
import { TeamCrest } from "@/components/teams/team-crest";
import type { StandingRow } from "@/types/football";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-zinc-500">積分榜尚無完賽資料。</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <ul className="divide-y divide-zinc-800 md:hidden">
        {rows.map((row) => (
          <li key={row.team.id}>
            <Link
              href={`/teams/${row.team.id}`}
              className="block px-3 py-2.5"
            >
              <span className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-xs tabular-nums text-zinc-500">
                  {row.rank}
                </span>
                <TeamCrest team={row.team} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {row.team.name}
                </span>
                <span className="text-xs tabular-nums text-zinc-500">
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </span>
                <span className="w-8 text-right text-sm font-semibold tabular-nums">
                  {row.points}
                </span>
              </span>
              <span className="mt-1.5 flex pl-8">
                <FormBadge form={row.form} emptyLabel="—" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <table className="hidden w-full min-w-[640px] text-left text-sm md:table">
        <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">球隊</th>
            <th className="px-3 py-2 text-right font-medium">場</th>
            <th className="px-3 py-2 text-right font-medium">勝</th>
            <th className="px-3 py-2 text-right font-medium">和</th>
            <th className="px-3 py-2 text-right font-medium">負</th>
            <th className="px-3 py-2 text-right font-medium">得失</th>
            <th className="px-3 py-2 text-right font-medium">積分</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team.id} className="border-t border-zinc-800">
              <td className="px-3 py-2 tabular-nums text-zinc-500">{row.rank}</td>
              <td className="px-3 py-2">
                <Link
                  href={`/teams/${row.team.id}`}
                  className="font-medium text-zinc-100 hover:text-emerald-400"
                >
                  <span className="flex items-center gap-2">
                    <TeamCrest team={row.team} />
                    <span className="truncate">{row.team.name}</span>
                  </span>
                  <span className="mt-1.5 flex pl-7">
                    <FormBadge form={row.form} emptyLabel="—" />
                  </span>
                </Link>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{row.played}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.won}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.drawn}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.lost}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-white">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
