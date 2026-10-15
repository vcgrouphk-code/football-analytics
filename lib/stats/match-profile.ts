import type { AnalysisContext, AnalysisRow } from "@/lib/stats/analysis";
import type { FixtureWithRelations } from "@/types/football";

function beforeKickoff(fixtures: FixtureWithRelations[], kickoffMs: number) {
  return fixtures.filter((fixture) => new Date(fixture.kickoffAt).getTime() < kickoffMs);
}

function calendarDays(earlierIso: string, laterIso: string) {
  const day = (iso: string) => {
    const text = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
    const [year, month, date] = text.split("-").map(Number);
    return Date.UTC(year, month - 1, date);
  };
  return Math.round((day(laterIso) - day(earlierIso)) / 86_400_000);
}

function finishedFor(fixtures: FixtureWithRelations[], teamId: string, kickoffMs: number) {
  return beforeKickoff(fixtures, kickoffMs)
    .filter((fixture) => fixture.status === "finished")
    .filter(
      (fixture) => fixture.homeTeam.id === teamId || fixture.awayTeam.id === teamId,
    );
}

function restLabel(fixtures: FixtureWithRelations[], teamId: string, kickoffAt: string) {
  const kickoffMs = new Date(kickoffAt).getTime();
  const previous = finishedFor(fixtures, teamId, kickoffMs).sort(
    (a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
  )[0];
  if (!previous) return "本季首場";
  const days = calendarDays(previous.kickoffAt, kickoffAt);
  if (days <= 0) return "同日";
  return `${days} 天`;
}

function countWithin(fixtures: FixtureWithRelations[], teamId: string, kickoffAt: string, days: number) {
  const kickoffMs = new Date(kickoffAt).getTime();
  const windowMs = days * 86_400_000;
  return finishedFor(fixtures, teamId, kickoffMs).filter(
    (fixture) => kickoffMs - new Date(fixture.kickoffAt).getTime() <= windowMs,
  ).length;
}

export function scheduleRows(context: AnalysisContext): AnalysisRow[] {
  const { fixture, homeFixtures, awayFixtures } = context;
  const homeId = fixture.homeTeam.id;
  const awayId = fixture.awayTeam.id;
  return [
    {
      label: "休息",
      note: "已同步賽事",
      kind: "record",
      home: restLabel(homeFixtures, homeId, fixture.kickoffAt),
      away: restLabel(awayFixtures, awayId, fixture.kickoffAt),
    },
    {
      label: "近 7 日完賽",
      home: `${countWithin(homeFixtures, homeId, fixture.kickoffAt, 7)} 場`,
      away: `${countWithin(awayFixtures, awayId, fixture.kickoffAt, 7)} 場`,
    },
    {
      label: "近 14 日完賽",
      home: `${countWithin(homeFixtures, homeId, fixture.kickoffAt, 14)} 場`,
      away: `${countWithin(awayFixtures, awayId, fixture.kickoffAt, 14)} 場`,
    },
  ];
}

function hasShotStats(fixture: FixtureWithRelations) {
  const stats = fixture.stats;
  if (!stats) return false;
  return (
    stats.homeXg != null ||
    stats.awayXg != null ||
    stats.homeShots != null ||
    stats.awayShots != null ||
    stats.homePossession != null ||
    stats.awayPossession != null
  );
}

function averageSide(
  fixtures: FixtureWithRelations[],
  teamId: string,
  pick: (fixture: FixtureWithRelations, isHome: boolean) => number | null,
) {
  const values = fixtures.flatMap((fixture) => {
    const isHome = fixture.homeTeam.id === teamId;
    const value = pick(fixture, isHome);
    return value == null ? [] : [value];
  });
  if (values.length < 2) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return { average: total / values.length, games: values.length };
}

export function shotRows(context: AnalysisContext): AnalysisRow[] | null {
  const { fixture, leagueFixtures } = context;
  const kickoffMs = new Date(fixture.kickoffAt).getTime();
  const played = beforeKickoff(leagueFixtures, kickoffMs).filter(
    (item) => item.status === "finished" && hasShotStats(item),
  );
  const homeId = fixture.homeTeam.id;
  const awayId = fixture.awayTeam.id;
  const cell = (
    sample: { average: number; games: number } | null,
    digits = 2,
  ) => (sample ? `${sample.average.toFixed(digits)}（${sample.games} 場）` : "—");

  const metric = (
    label: string,
    pick: (fixture: FixtureWithRelations, isHome: boolean) => number | null,
    digits = 2,
  ): AnalysisRow => ({
    label,
    home: cell(averageSide(played, homeId, pick), digits),
    away: cell(averageSide(played, awayId, pick), digits),
  });

  const rows = [
    metric("場均 xG", (item, isHome) => (isHome ? item.stats?.homeXg : item.stats?.awayXg) ?? null),
    metric("場均 xGA", (item, isHome) => (isHome ? item.stats?.awayXg : item.stats?.homeXg) ?? null),
    metric("場均射門", (item, isHome) => (isHome ? item.stats?.homeShots : item.stats?.awayShots) ?? null, 1),
    metric(
      "場均射正",
      (item, isHome) =>
        (isHome ? item.stats?.homeShotsOnTarget : item.stats?.awayShotsOnTarget) ?? null,
      1,
    ),
    metric(
      "場均控球",
      (item, isHome) => (isHome ? item.stats?.homePossession : item.stats?.awayPossession) ?? null,
      0,
    ),
  ];

  if (rows.every((row) => row.home === "—" && row.away === "—")) return null;
  return rows;
}
