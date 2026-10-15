import type { FixtureWithRelations, LeagueSummary } from "@/types/football";

function seasonYear(season: string) {
  const year = Number(season.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

/** 同一聯賽只留最新賽季，舊賽季留在聯賽列表。 */
export function latestSeasonByName(leagues: LeagueSummary[]) {
  const best = new Map<string, LeagueSummary>();
  for (const league of leagues) {
    const current = best.get(league.name);
    if (!current || seasonYear(league.season) > seasonYear(current.season)) {
      best.set(league.name, league);
    }
  }
  return [...best.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-Hant"),
  );
}

export function currentRoundLabel(fixtures: FixtureWithRelations[]) {
  const rounds = fixtures.flatMap((fixture) => {
    const match = fixture.round?.match(/第\s*(\d+)\s*輪/);
    return match ? [{ n: Number(match[1]), status: fixture.status }] : [];
  });
  if (!rounds.length) return null;
  const open = rounds.filter(
    (round) => round.status === "live" || round.status === "scheduled",
  );
  const round = open.length
    ? Math.min(...open.map((item) => item.n))
    : Math.max(...rounds.map((item) => item.n));
  return `第 ${round} 輪`;
}

export function splitToday(fixtures: FixtureWithRelations[], now: number) {
  const live: FixtureWithRelations[] = [];
  const awaiting: FixtureWithRelations[] = [];
  const upcoming: FixtureWithRelations[] = [];
  const finished: FixtureWithRelations[] = [];
  const other: FixtureWithRelations[] = [];

  for (const fixture of fixtures) {
    if (fixture.status === "live") live.push(fixture);
    else if (fixture.status === "finished") finished.push(fixture);
    else if (fixture.status === "scheduled") {
      if (new Date(fixture.kickoffAt).getTime() <= now) awaiting.push(fixture);
      else upcoming.push(fixture);
    } else other.push(fixture);
  }

  return { live, awaiting, upcoming, finished, other };
}

export function groupByLeague(fixtures: FixtureWithRelations[]) {
  const groups: { league: LeagueSummary; fixtures: FixtureWithRelations[] }[] =
    [];
  for (const fixture of fixtures) {
    const existing = groups.find((group) => group.league.id === fixture.league.id);
    if (existing) existing.fixtures.push(fixture);
    else groups.push({ league: fixture.league, fixtures: [fixture] });
  }
  return groups;
}

export function formatHongKongTime(iso: string) {
  return new Intl.DateTimeFormat("zh-Hant", {
    timeZone: "Asia/Hong_Kong",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
