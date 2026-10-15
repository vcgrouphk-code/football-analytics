import { MatchBriefingView } from "@/components/fixtures/match-briefing";
import type { AnalysisRow } from "@/lib/stats/analysis";
import type { AnalysisPointResult } from "@/lib/stats/points";

function Bars({ bars }: { bars: AnalysisPointResult["bars"] }) {
  return (
    <div className="space-y-2">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-zinc-400">{bar.label}</span>
            <span className="tabular-nums text-zinc-200">{bar.value}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${bar.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RowTable({
  caption,
  rows,
  homeName,
  awayName,
}: {
  caption: string;
  rows: AnalysisRow[];
  homeName: string;
  awayName: string;
}) {
  if (!rows.length) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-medium tracking-wide text-zinc-500">{caption}</p>
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="text-xs text-zinc-500">
            <th className="pb-2 text-left font-normal">指標</th>
            <th className="truncate pb-2 text-right font-normal">{homeName}</th>
            <th className="truncate pb-2 text-right font-normal">{awayName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-zinc-800/80">
              <td className="py-2 text-zinc-400">
                {row.label}
                {row.note && (
                  <span className="mt-0.5 block text-[10px] leading-tight text-zinc-600">
                    {row.note}
                  </span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums text-zinc-100">{row.home}</td>
              <td className="py-2 text-right tabular-nums text-zinc-100">{row.away}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalysisList({ points }: { points: AnalysisPointResult[] }) {
  if (!points.length) return null;

  return (
    <div className="space-y-4">
      {points.map((point) => (
        <section
          key={point.id}
          className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <div>
            <h2 className="text-sm font-medium text-zinc-300">{point.title}</h2>
            {point.summary && (
              <p className="mt-1 text-xs text-zinc-500">{point.summary}</p>
            )}
          </div>
          {point.briefing && <MatchBriefingView briefing={point.briefing} />}
          {point.rows.length > 0 && (
            <div className="space-y-4">
              <RowTable
                caption="紀錄"
                rows={point.rows.filter((row) => row.kind !== "estimate")}
                homeName={point.homeName}
                awayName={point.awayName}
              />
              <RowTable
                caption="估算"
                rows={point.rows.filter((row) => row.kind === "estimate")}
                homeName={point.homeName}
                awayName={point.awayName}
              />
            </div>
          )}
          {point.bars.length > 0 && <Bars bars={point.bars} />}
        </section>
      ))}
    </div>
  );
}
