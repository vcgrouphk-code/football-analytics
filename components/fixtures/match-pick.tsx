"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  MATCH_PICK_LABEL,
  matchPickVerdict,
  type MatchPickChoice,
} from "@/lib/football/match-pick";
import type { FixtureWithRelations } from "@/types/football";

const STORAGE_KEY = "pitchmetrics.match-picks";

type PicksApi = {
  ready: boolean;
  picks: Record<string, MatchPickChoice>;
  setPick: (fixtureId: string, choice: MatchPickChoice | "") => void;
};

const PicksContext = createContext<PicksApi | null>(null);

function readPicks(): Record<string, MatchPickChoice> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const picks: Record<string, MatchPickChoice> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (value === "home" || value === "draw" || value === "away") picks[id] = value;
    }
    return picks;
  } catch {
    return {};
  }
}

function writePicks(picks: Record<string, MatchPickChoice>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
}

const toneClass = {
  pending: "text-zinc-500",
  result: "text-zinc-300",
  hit: "text-emerald-400",
  miss: "text-zinc-400",
  void: "text-zinc-600",
};

export function TodayPicks({
  fixtures,
  children,
}: {
  fixtures: FixtureWithRelations[];
  children: ReactNode;
}) {
  const [picks, setPicks] = useState<Record<string, MatchPickChoice>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPicks(readPicks());
    setReady(true);
  }, []);

  function setPick(fixtureId: string, choice: MatchPickChoice | "") {
    setPicks((current) => {
      const next = { ...current };
      if (choice) next[fixtureId] = choice;
      else delete next[fixtureId];
      writePicks(next);
      return next;
    });
  }

  const chosen = fixtures.filter((fixture) => picks[fixture.id]);

  return (
    <PicksContext.Provider value={{ ready, picks, setPick }}>
      <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
        <p className="text-xs font-medium text-zinc-300">我的選擇</p>
        {chosen.length === 0 ? (
          <p className="text-xs text-zinc-500">
            在下面每場選擇主勝、和局或客勝。完場後會在這裡顯示比分，以及有沒有命中。
          </p>
        ) : (
          <ul className="space-y-1.5">
            {chosen.map((fixture) => {
              const verdict = matchPickVerdict(
                picks[fixture.id],
                fixture.status,
                fixture.homeScore,
                fixture.awayScore,
              );
              return (
                <li
                  key={fixture.id}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <span className="truncate text-zinc-200">
                    {fixture.homeTeam.name}
                    <span className="mx-1 text-zinc-600">vs</span>
                    {fixture.awayTeam.name}
                    <span className="ml-2 text-zinc-500">
                      {MATCH_PICK_LABEL[picks[fixture.id]]}
                    </span>
                  </span>
                  <span className={`shrink-0 tabular-nums ${toneClass[verdict.tone]}`}>
                    {verdict.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {children}
    </PicksContext.Provider>
  );
}

export function MatchPick({
  fixtureId,
  homeName,
  awayName,
  status,
  homeScore,
  awayScore,
}: {
  fixtureId: string;
  homeName: string;
  awayName: string;
  status: FixtureWithRelations["status"];
  homeScore: number | null;
  awayScore: number | null;
}) {
  const api = useContext(PicksContext);
  const choice = api?.picks[fixtureId] ?? "";
  const settled = status === "finished" || status === "postponed" || status === "cancelled";
  const verdict = matchPickVerdict(choice, status, homeScore, awayScore);

  return (
    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <label className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span>我的選擇</span>
        <select
          aria-label={`${homeName} 對 ${awayName} 的賽果`}
          value={choice}
          disabled={!api?.ready || settled}
          onChange={(event) => {
            const value = event.target.value;
            const next = value === "home" || value === "draw" || value === "away" ? value : "";
            api?.setPick(fixtureId, next);
          }}
          className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:text-zinc-500"
        >
          <option value="">選擇賽果</option>
          <option value="home">主勝</option>
          <option value="draw">和局</option>
          <option value="away">客勝</option>
        </select>
      </label>
      <p className={`text-[11px] tabular-nums ${toneClass[verdict.tone]}`}>{verdict.text}</p>
    </div>
  );
}
