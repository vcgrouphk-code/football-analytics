import type { FixtureWithRelations, StandingRow, TeamSummary } from "@/types/football";
import { buildForm } from "@/lib/stats/form";

export function buildTable(fixtures: FixtureWithRelations[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  const ensure = (team: TeamSummary) => {
    const existing = rows.get(team.id);
    if (existing) return existing;
    const row: StandingRow = {
      rank: 0,
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    };
    rows.set(team.id, row);
    return row;
  };

  for (const fixture of fixtures) {
    ensure(fixture.homeTeam);
    ensure(fixture.awayTeam);
    if (fixture.status !== "finished") continue;
    if (fixture.homeScore == null || fixture.awayScore == null) continue;

    const home = ensure(fixture.homeTeam);
    const away = ensure(fixture.awayTeam);
    home.played += 1;
    away.played += 1;
    home.goalsFor += fixture.homeScore;
    home.goalsAgainst += fixture.awayScore;
    away.goalsFor += fixture.awayScore;
    away.goalsAgainst += fixture.homeScore;

    if (fixture.homeScore > fixture.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (fixture.homeScore < fixture.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const table = [...rows.values()].map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }));

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name, "zh-Hant");
  });

  return table.map((row, index) => ({
    ...row,
    rank: index + 1,
    form: buildForm(
      fixtures.filter(
        (fixture) =>
          fixture.homeTeam.id === row.team.id ||
          fixture.awayTeam.id === row.team.id,
      ),
      row.team.id,
    ),
  }));
}
