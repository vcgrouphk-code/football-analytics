import { buildForm } from "@/lib/stats/form";
import type {
  FixtureWithRelations,
  LeagueSummary,
  TeamSeasonSnapshot,
  TeamSummary,
} from "@/types/football";

const league: LeagueSummary = {
  id: "league-epl-2025",
  name: "英格蘭超級聯賽",
  country: "England",
  season: "2025/26",
};

const teams: Record<string, TeamSummary> = {
  ars: { id: "team-ars", name: "阿森纳", shortName: "ARS" },
  liv: { id: "team-liv", name: "利物浦", shortName: "LIV" },
  mci: { id: "team-mci", name: "曼城", shortName: "MCI" },
  che: { id: "team-che", name: "切尔西", shortName: "CHE" },
  tot: { id: "team-tot", name: "托特纳姆热刺", shortName: "TOT" },
};

function fixture(
  id: string,
  home: TeamSummary,
  away: TeamSummary,
  kickoffAt: string,
  status: FixtureWithRelations["status"],
  homeScore: number | null,
  awayScore: number | null,
  stats?: FixtureWithRelations["stats"],
): FixtureWithRelations {
  return {
    id,
    kickoffAt,
    status,
    homeScore,
    awayScore,
    venue: "Demo Stadium",
    round: "第 8 輪",
    league,
    homeTeam: home,
    awayTeam: away,
    stats: stats ?? null,
  };
}

export const sampleFixtures: FixtureWithRelations[] = [
  fixture(
    "fx-1",
    teams.ars,
    teams.liv,
    "2025-10-12T15:30:00.000Z",
    "finished",
    2,
    1,
    {
      homeXg: 1.82,
      awayXg: 1.05,
      homeShots: 14,
      awayShots: 9,
      homeShotsOnTarget: 6,
      awayShotsOnTarget: 3,
      homePossession: 54,
      awayPossession: 46,
      homeCorners: 7,
      awayCorners: 4,
    },
  ),
  fixture(
    "fx-2",
    teams.mci,
    teams.che,
    "2025-10-11T11:30:00.000Z",
    "finished",
    3,
    1,
    {
      homeXg: 2.41,
      awayXg: 0.88,
      homeShots: 18,
      awayShots: 7,
      homeShotsOnTarget: 8,
      awayShotsOnTarget: 2,
      homePossession: 61,
      awayPossession: 39,
      homeCorners: 9,
      awayCorners: 2,
    },
  ),
  fixture(
    "fx-3",
    teams.tot,
    teams.ars,
    "2025-10-05T13:00:00.000Z",
    "finished",
    1,
    1,
    {
      homeXg: 1.12,
      awayXg: 1.08,
      homeShots: 11,
      awayShots: 12,
      homeShotsOnTarget: 4,
      awayShotsOnTarget: 5,
      homePossession: 48,
      awayPossession: 52,
      homeCorners: 5,
      awayCorners: 6,
    },
  ),
  fixture(
    "fx-4",
    teams.liv,
    teams.mci,
    "2025-09-28T15:30:00.000Z",
    "finished",
    0,
    2,
    {
      homeXg: 0.76,
      awayXg: 1.95,
      homeShots: 8,
      awayShots: 15,
      homeShotsOnTarget: 2,
      awayShotsOnTarget: 7,
      homePossession: 44,
      awayPossession: 56,
      homeCorners: 3,
      awayCorners: 8,
    },
  ),
  fixture(
    "fx-5",
    teams.che,
    teams.tot,
    "2025-09-21T13:00:00.000Z",
    "finished",
    2,
    0,
    {
      homeXg: 1.55,
      awayXg: 0.62,
      homeShots: 13,
      awayShots: 6,
      homeShotsOnTarget: 5,
      awayShotsOnTarget: 1,
      homePossession: 57,
      awayPossession: 43,
      homeCorners: 6,
      awayCorners: 1,
    },
  ),
  fixture(
    "fx-6",
    teams.ars,
    teams.mci,
    "2025-10-18T15:30:00.000Z",
    "scheduled",
    null,
    null,
  ),
  fixture(
    "fx-7",
    teams.liv,
    teams.che,
    "2025-10-19T13:00:00.000Z",
    "scheduled",
    null,
    null,
  ),
];

export const sampleLeagues: LeagueSummary[] = [league];

export const sampleTeams: TeamSummary[] = Object.values(teams);

export function getSampleFixture(id: string) {
  return sampleFixtures.find((f) => f.id === id) ?? null;
}

export function getSampleTeamSnapshot(teamId: string): TeamSeasonSnapshot | null {
  const team = sampleTeams.find((t) => t.id === teamId);
  if (!team) return null;

  const involved = sampleFixtures.filter(
    (f) =>
      f.homeTeam.id === teamId ||
      f.awayTeam.id === teamId ||
      f.status === "finished",
  );

  const finished = sampleFixtures.filter(
    (f) =>
      f.status === "finished" &&
      (f.homeTeam.id === teamId || f.awayTeam.id === teamId),
  );

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let xgFor = 0;
  let xgAgainst = 0;

  for (const f of finished) {
    const isHome = f.homeTeam.id === teamId;
    const gf = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const ga = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    goalsFor += gf;
    goalsAgainst += ga;
    if (f.stats) {
      xgFor += isHome ? (f.stats.homeXg ?? 0) : (f.stats.awayXg ?? 0);
      xgAgainst += isHome ? (f.stats.awayXg ?? 0) : (f.stats.homeXg ?? 0);
    }
    if (gf > ga) wins++;
    else if (gf < ga) losses++;
    else draws++;
  }

  return {
    team,
    league,
    played: finished.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    xgFor: Math.round(xgFor * 100) / 100,
    xgAgainst: Math.round(xgAgainst * 100) / 100,
    form: buildForm(involved, teamId),
    recentFixtures: finished
      .sort(
        (a, b) =>
          new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
      )
      .slice(0, 5),
  };
}
