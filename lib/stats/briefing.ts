import type {
  FixtureWithRelations,
  TeamFormResult,
  TeamSummary,
} from "@/types/football";
import type { AnalysisContext } from "@/lib/stats/analysis";
import { resultForTeam } from "@/lib/stats/form";
import { buildTable } from "@/lib/stats/table";

export type SideBrief = {
  team: TeamSummary;
  rank: number | null;
  points: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  form: TeamFormResult[];
  restDays: number | null;
};

export type WinChances = {
  home: number;
  draw: number;
  away: number;
};

export type MatchNature = {
  kind: "正式比賽" | "友誼賽";
  summary: string;
};

export type MatchBriefing = {
  home: SideBrief;
  away: SideBrief;
  meetings: FixtureWithRelations[];
  nature: MatchNature;
  chances: WinChances | null;
  comment: string;
};

function playedBy(fixtures: FixtureWithRelations[], teamId: string) {
  return fixtures.filter(
    (fixture) =>
      fixture.homeTeam.id === teamId || fixture.awayTeam.id === teamId,
  );
}

function beforeKickoff(fixtures: FixtureWithRelations[], kickoffMs: number) {
  return fixtures.filter(
    (fixture) => new Date(fixture.kickoffAt).getTime() < kickoffMs,
  );
}

function venueForm(
  fixtures: FixtureWithRelations[],
  teamId: string,
  venue: "home" | "away",
  kickoffMs: number,
) {
  return beforeKickoff(fixtures, kickoffMs)
    .filter((fixture) => fixture.status === "finished")
    .filter((fixture) =>
      venue === "home"
        ? fixture.homeTeam.id === teamId
        : fixture.awayTeam.id === teamId,
    )
    .sort(
      (a, b) =>
        new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
    )
    .slice(0, 5)
    .reverse()
    .map((fixture) => resultForTeam(fixture, teamId))
    .filter((result): result is TeamFormResult => result !== null);
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

function restDays(
  fixtures: FixtureWithRelations[],
  teamId: string,
  kickoffAt: string,
) {
  const kickoffMs = new Date(kickoffAt).getTime();
  const previous = beforeKickoff(playedBy(fixtures, teamId), kickoffMs)
    .filter((fixture) => fixture.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
    )[0];
  if (!previous) return null;
  return calendarDays(previous.kickoffAt, kickoffAt);
}

function sideBrief(
  team: TeamSummary,
  leagueFixtures: FixtureWithRelations[],
  table: ReturnType<typeof buildTable>,
  recentFixtures: FixtureWithRelations[],
  kickoffAt: string,
  venue: "home" | "away",
): SideBrief {
  const row = table.find((item) => item.team.id === team.id);
  return {
    team,
    rank: row?.rank ?? null,
    points: row?.points ?? 0,
    played: row?.played ?? 0,
    goalsFor: row?.goalsFor ?? 0,
    goalsAgainst: row?.goalsAgainst ?? 0,
    form: venueForm(leagueFixtures, team.id, venue, new Date(kickoffAt).getTime()),
    restDays: restDays(recentFixtures, team.id, kickoffAt),
  };
}

export function buildMatchBriefing(context: AnalysisContext): MatchBriefing {
  const { fixture, leagueFixtures, homeFixtures, awayFixtures } = context;
  const kickoffMs = new Date(fixture.kickoffAt).getTime();
  const priorFixtures = beforeKickoff(leagueFixtures, kickoffMs);
  const table = buildTable(priorFixtures);
  const meetings = beforeKickoff(leagueFixtures, kickoffMs)
    .filter((item) => item.status === "finished")
    .filter((item) => {
      const ids = [item.homeTeam.id, item.awayTeam.id];
      return (
        ids.includes(fixture.homeTeam.id) && ids.includes(fixture.awayTeam.id)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
    )
    .slice(0, 5);

  const home = sideBrief(
    fixture.homeTeam,
    priorFixtures,
    table,
    homeFixtures,
    fixture.kickoffAt,
    "home",
  );
  const away = sideBrief(
    fixture.awayTeam,
    priorFixtures,
    table,
    awayFixtures,
    fixture.kickoffAt,
    "away",
  );

  return {
    home,
    away,
    meetings,
    ...matchComment(fixture, leagueFixtures, home, away),
  };
}

function matchNature(leagueName: string): MatchNature {
  if (/友誼|friendly/i.test(leagueName)) {
    return {
      kind: "友誼賽",
      summary: "這場列為友誼賽，一般不計入聯賽積分。",
    };
  }
  if (leagueName === "世界盃" || leagueName === "歐洲國家盃") {
    return {
      kind: "正式比賽",
      summary: `這場是${leagueName}，屬國家隊正式比賽。`,
    };
  }
  if (leagueName === "歐洲冠軍聯賽" || leagueName === "南美自由盃") {
    return {
      kind: "正式比賽",
      summary: `這場是${leagueName}，屬正式比賽。`,
    };
  }
  return {
    kind: "正式比賽",
    summary: `這場是${leagueName}，屬聯賽正式比賽，會計入積分榜。`,
  };
}

function poisson(lambda: number, goals: number) {
  let value = Math.exp(-lambda);
  for (let index = 1; index <= goals; index += 1) value *= lambda / index;
  return value;
}

function toPercent(home: number, draw: number, away: number): WinChances {
  const total = home + draw + away;
  const raw = [home, draw, away].map((value) => (value / total) * 100);
  const floors = raw.map((value) => Math.floor(value));
  let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - floors[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; index < remainder; index += 1) {
    floors[order[index].index] += 1;
  }
  return { home: floors[0], draw: floors[1], away: floors[2] };
}

export type ScoreModel = {
  lambdaHome: number;
  lambdaAway: number;
  homeFor: number;
  homeAgainst: number;
  homePlayed: number;
  homeVenueFor: number | null;
  homeVenueAgainst: number | null;
  homeVenuePlayed: number;
  awayFor: number;
  awayAgainst: number;
  awayPlayed: number;
  awayVenueFor: number | null;
  awayVenueAgainst: number | null;
  awayVenuePlayed: number;
};

export function scoreModelExpectedGoals(
  leagueFixtures: FixtureWithRelations[],
  homeId: string,
  awayId: string,
  kickoffMs: number,
): ScoreModel | null {
  const played = beforeKickoff(leagueFixtures, kickoffMs).filter(
    (fixture) =>
      fixture.status === "finished" &&
      fixture.homeScore != null &&
      fixture.awayScore != null,
  );
  if (played.length < 4) return null;

  let homeGoals = 0;
  let awayGoals = 0;
  const teams = new Map<
    string,
    { homePlayed: number; homeFor: number; homeAgainst: number; awayPlayed: number; awayFor: number; awayAgainst: number }
  >();
  const ensure = (teamId: string) => {
    const current = teams.get(teamId) ?? {
      homePlayed: 0,
      homeFor: 0,
      homeAgainst: 0,
      awayPlayed: 0,
      awayFor: 0,
      awayAgainst: 0,
    };
    teams.set(teamId, current);
    return current;
  };

  for (const fixture of played) {
    homeGoals += fixture.homeScore ?? 0;
    awayGoals += fixture.awayScore ?? 0;
    const home = ensure(fixture.homeTeam.id);
    const away = ensure(fixture.awayTeam.id);
    home.homePlayed += 1;
    home.homeFor += fixture.homeScore ?? 0;
    home.homeAgainst += fixture.awayScore ?? 0;
    away.awayPlayed += 1;
    away.awayFor += fixture.awayScore ?? 0;
    away.awayAgainst += fixture.homeScore ?? 0;
  }

  const leagueHome = homeGoals / played.length || 1.3;
  const leagueAway = awayGoals / played.length || 1.05;
  const leagueAvg = (leagueHome + leagueAway) / 2 || 1.2;
  const prior = 4;
  const rate = (goals: number, games: number, average: number) =>
    (goals + average * prior) / (games + prior);
  const blend = (
    venueGoals: number,
    venueGames: number,
    venueAverage: number,
    overallGoals: number,
    overallGames: number,
  ) => {
    const venue = rate(venueGoals, venueGames, venueAverage) / venueAverage;
    const overall = overallGames
      ? rate(overallGoals, overallGames, leagueAvg) / leagueAvg
      : 1;
    const weight = Math.min(1, venueGames / prior);
    return venue * weight + overall * (1 - weight);
  };

  const homeTeam = ensure(homeId);
  const awayTeam = ensure(awayId);
  const perGame = (goals: number, games: number) => (games ? goals / games : null);
  const lambdaHome = Math.min(
    4.5,
    Math.max(
      0.15,
      leagueHome *
        blend(
          homeTeam.homeFor,
          homeTeam.homePlayed,
          leagueHome,
          homeTeam.homeFor + homeTeam.awayFor,
          homeTeam.homePlayed + homeTeam.awayPlayed,
        ) *
        blend(
          awayTeam.awayAgainst,
          awayTeam.awayPlayed,
          leagueHome,
          awayTeam.homeAgainst + awayTeam.awayAgainst,
          awayTeam.homePlayed + awayTeam.awayPlayed,
        ),
    ),
  );
  const lambdaAway = Math.min(
    4.5,
    Math.max(
      0.15,
      leagueAway *
        blend(
          awayTeam.awayFor,
          awayTeam.awayPlayed,
          leagueAway,
          awayTeam.homeFor + awayTeam.awayFor,
          awayTeam.homePlayed + awayTeam.awayPlayed,
        ) *
        blend(
          homeTeam.homeAgainst,
          homeTeam.homePlayed,
          leagueAway,
          homeTeam.homeAgainst + homeTeam.awayAgainst,
          homeTeam.homePlayed + homeTeam.awayPlayed,
        ),
    ),
  );

  const homePlayed = homeTeam.homePlayed + homeTeam.awayPlayed;
  const awayPlayed = awayTeam.homePlayed + awayTeam.awayPlayed;

  return {
    lambdaHome,
    lambdaAway,
    homePlayed,
    awayPlayed,
    homeFor: perGame(homeTeam.homeFor + homeTeam.awayFor, homePlayed) ?? 0,
    homeAgainst: perGame(homeTeam.homeAgainst + homeTeam.awayAgainst, homePlayed) ?? 0,
    homeVenuePlayed: homeTeam.homePlayed,
    homeVenueFor: perGame(homeTeam.homeFor, homeTeam.homePlayed),
    homeVenueAgainst: perGame(homeTeam.homeAgainst, homeTeam.homePlayed),
    awayFor: perGame(awayTeam.homeFor + awayTeam.awayFor, awayPlayed) ?? 0,
    awayAgainst: perGame(awayTeam.homeAgainst + awayTeam.awayAgainst, awayPlayed) ?? 0,
    awayVenuePlayed: awayTeam.awayPlayed,
    awayVenueFor: perGame(awayTeam.awayFor, awayTeam.awayPlayed),
    awayVenueAgainst: perGame(awayTeam.awayAgainst, awayTeam.awayPlayed),
  };
}

export function estimateWinChances(
  leagueFixtures: FixtureWithRelations[],
  homeId: string,
  awayId: string,
  kickoffMs: number,
): WinChances | null {
  const model = scoreModelExpectedGoals(leagueFixtures, homeId, awayId, kickoffMs);
  if (!model) return null;
  const { lambdaHome, lambdaAway } = model;

  let home = 0;
  let draw = 0;
  let away = 0;
  for (let homeScore = 0; homeScore <= 8; homeScore += 1) {
    for (let awayScore = 0; awayScore <= 8; awayScore += 1) {
      const probability = poisson(lambdaHome, homeScore) * poisson(lambdaAway, awayScore);
      if (homeScore > awayScore) home += probability;
      else if (homeScore === awayScore) draw += probability;
      else away += probability;
    }
  }
  return toPercent(home, draw, away);
}

function restNote(days: number | null, name: string) {
  if (days == null || days > 3) return "";
  if (days <= 0) return `${name}上一場在同一天，體能是變數。`;
  return `${name}距上一場只有 ${days} 天，體能是變數。`;
}

function matchComment(
  fixture: FixtureWithRelations,
  leagueFixtures: FixtureWithRelations[],
  home: SideBrief,
  away: SideBrief,
) {
  const nature = matchNature(fixture.league.name);
  const chances = estimateWinChances(
    leagueFixtures,
    fixture.homeTeam.id,
    fixture.awayTeam.id,
    new Date(fixture.kickoffAt).getTime(),
  );
  const outlook = !chances
    ? "本季完賽樣本還少，暫不估算勝出機會。"
    : chances.home >= chances.away + 12
      ? `${home.team.name}的勝出機會較高。`
      : chances.away >= chances.home + 12
        ? `${away.team.name}的勝出機會較高。`
        : "雙方勝出機會接近。";
  const rest = [restNote(home.restDays, home.team.name), restNote(away.restDays, away.team.name)]
    .filter(Boolean)
    .join("");
  return {
    nature,
    chances,
    comment: `${nature.summary}${outlook}${rest}`,
  };
}
