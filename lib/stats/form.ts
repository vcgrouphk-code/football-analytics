import type { FixtureWithRelations, TeamFormResult } from "@/types/football";

export function resultForTeam(
  fixture: FixtureWithRelations,
  teamId: string,
): TeamFormResult | null {
  if (fixture.status !== "finished") return null;
  if (fixture.homeScore == null || fixture.awayScore == null) return null;

  const isHome = fixture.homeTeam.id === teamId;
  const isAway = fixture.awayTeam.id === teamId;
  if (!isHome && !isAway) return null;

  const gf = isHome ? fixture.homeScore : fixture.awayScore;
  const ga = isHome ? fixture.awayScore : fixture.homeScore;

  if (gf > ga) return "W";
  if (gf < ga) return "L";
  return "D";
}

export function buildForm(
  fixtures: FixtureWithRelations[],
  teamId: string,
  limit = 5,
): TeamFormResult[] {
  return fixtures
    .filter((f) => f.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
    )
    .map((f) => resultForTeam(f, teamId))
    .filter((r): r is TeamFormResult => r !== null)
    .slice(0, limit)
    .reverse();
}

export function pointsFromForm(form: TeamFormResult[]): number {
  return form.reduce(
    (acc, r) => acc + (r === "W" ? 3 : r === "D" ? 1 : 0),
    0,
  );
}
