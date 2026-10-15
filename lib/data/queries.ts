import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils/env";
import {
  getSampleFixture,
  getSampleTeamSnapshot,
  sampleFixtures,
  sampleLeagues,
  sampleTeams,
} from "@/lib/data/sample";
import type {
  FixtureStats,
  FixtureWithRelations,
  LeagueSummary,
  StandingRow,
  TeamSeasonSnapshot,
  TeamSummary,
} from "@/types/football";
import { currentRoundLabel } from "@/lib/football/dashboard-view";
import { estimateWinChances, type WinChances } from "@/lib/stats/briefing";
import { runMatchPoints } from "@/lib/stats/points";
import { buildTable } from "@/lib/stats/table";
import type { FixtureStatus } from "@/types/database";
import {
  displayLeagueName,
  displayRound,
  displaySeason,
  displayTeamName,
} from "@/lib/football/display-zh";

type FixtureRow = {
  id: string;
  kickoff_at: string;
  status: FixtureStatus;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  round: string | null;
  league: {
    id: string;
    name: string;
    country: string | null;
    season: string;
    logo_url: string | null;
  };
  home: {
    id: string;
    name: string;
    short_name: string | null;
    logo_url: string | null;
  };
  away: {
    id: string;
    name: string;
    short_name: string | null;
    logo_url: string | null;
  };
  stats: unknown;
};

function normalizeStats(raw: unknown): FixtureStats | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") return null;
  return mapStats(row as Parameters<typeof mapStats>[0]);
}

function mapStats(row: {
  home_xg: number | null;
  away_xg: number | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_possession: number | null;
  away_possession: number | null;
  home_corners: number | null;
  away_corners: number | null;
} | null): FixtureStats | null {
  if (!row) return null;
  return {
    homeXg: row.home_xg,
    awayXg: row.away_xg,
    homeShots: row.home_shots,
    awayShots: row.away_shots,
    homeShotsOnTarget: row.home_shots_on_target,
    awayShotsOnTarget: row.away_shots_on_target,
    homePossession: row.home_possession,
    awayPossession: row.away_possession,
    homeCorners: row.home_corners,
    awayCorners: row.away_corners,
  };
}

function mapFixture(row: FixtureRow): FixtureWithRelations {
  return {
    id: row.id,
    kickoffAt: row.kickoff_at,
    status: row.status,
    homeScore: row.home_score,
    awayScore: row.away_score,
    venue: row.venue,
    round: displayRound(row.round),
    league: {
      id: row.league.id,
      name: displayLeagueName(row.league.name),
      country: row.league.country,
      season: displaySeason(row.league.season),
      logoUrl: row.league.logo_url,
    },
    homeTeam: {
      id: row.home.id,
      name: displayTeamName(row.home.name),
      shortName: row.home.short_name,
      logoUrl: row.home.logo_url,
    },
    awayTeam: {
      id: row.away.id,
      name: displayTeamName(row.away.name),
      shortName: row.away.short_name,
      logoUrl: row.away.logo_url,
    },
    stats: normalizeStats(row.stats),
  };
}

const FIXTURE_SELECT = `
  id,
  kickoff_at,
  status,
  home_score,
  away_score,
  venue,
  round,
  league:leagues (
    id, name, country, season, logo_url
  ),
  home:teams!fixtures_home_team_id_fkey (
    id, name, short_name, logo_url
  ),
  away:teams!fixtures_away_team_id_fkey (
    id, name, short_name, logo_url
  ),
  stats:fixture_stats (
    home_xg, away_xg,
    home_shots, away_shots,
    home_shots_on_target, away_shots_on_target,
    home_possession, away_possession,
    home_corners, away_corners
  )
`;

export async function listLeagues(): Promise<LeagueSummary[]> {
  if (!isSupabaseConfigured()) return sampleLeagues;

  const supabase = await createClient();
  const { data, error } = await supabase.from("leagues").select("*");

  if (error || !data?.length) return sampleLeagues;

  return data.map((l) => ({
    id: l.id,
    name: displayLeagueName(l.name),
    country: l.country,
    season: displaySeason(l.season),
    logoUrl: l.logo_url,
    provider: l.provider,
  }));
}

export async function listTeams(): Promise<TeamSummary[]> {
  if (!isSupabaseConfigured()) return sampleTeams;

  const supabase = await createClient();
  const { data, error } = await supabase.from("teams").select("*").limit(50);

  if (error || !data?.length) return sampleTeams;

  return data.map((t) => ({
    id: t.id,
    name: displayTeamName(t.name),
    shortName: t.short_name,
    logoUrl: t.logo_url,
  }));
}

export async function listFixtures(limit = 20): Promise<FixtureWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return [...sampleFixtures]
      .sort(
        (a, b) =>
          new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
      )
      .slice(0, limit);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .order("kickoff_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return sampleFixtures.slice(0, limit);
  }

  return (data as unknown as FixtureRow[]).map((row) =>
    mapFixture({ ...row, stats: normalizeStats(row.stats) }),
  );
}

export async function getFixture(
  id: string,
): Promise<FixtureWithRelations | null> {
  if (!isSupabaseConfigured()) return getSampleFixture(id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return getSampleFixture(id);

  const row = data as unknown as FixtureRow;
  return mapFixture({ ...row, stats: normalizeStats(row.stats) });
}

export async function getTeamSnapshot(
  teamId: string,
): Promise<TeamSeasonSnapshot | null> {
  if (!isSupabaseConfigured()) return getSampleTeamSnapshot(teamId);

  const supabase = await createClient();
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !team) return getSampleTeamSnapshot(teamId);

  const { data: fixtures, error: fxError } = await supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("kickoff_at", { ascending: false })
    .limit(200);

  if (fxError || !fixtures?.length) return getSampleTeamSnapshot(teamId);

  const mapped = (fixtures as unknown as FixtureRow[]).map((row) =>
    mapFixture({ ...row, stats: normalizeStats(row.stats) }),
  );
  const league = chooseTeamLeague(mapped);
  const leagueFixtures = mapped.filter((fixture) => fixture.league.id === league.id);

  const { buildForm } = await import("@/lib/stats/form");
  const finished = leagueFixtures.filter((fixture) => fixture.status === "finished");
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let xgFor = 0;
  let xgAgainst = 0;

  for (const fixture of finished) {
    const isHome = fixture.homeTeam.id === teamId;
    const gf = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0);
    const ga = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0);
    goalsFor += gf;
    goalsAgainst += ga;
    if (fixture.stats) {
      xgFor += isHome ? (fixture.stats.homeXg ?? 0) : (fixture.stats.awayXg ?? 0);
      xgAgainst += isHome ? (fixture.stats.awayXg ?? 0) : (fixture.stats.homeXg ?? 0);
    }
    if (gf > ga) wins++;
    else if (gf < ga) losses++;
    else draws++;
  }

  const leagueRecord = league;

  return {
    team: {
      id: team.id,
      name: displayTeamName(team.name),
      shortName: team.short_name,
      logoUrl: team.logo_url,
    },
    league: leagueRecord,
    played: finished.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    xgFor: Math.round(xgFor * 100) / 100,
    xgAgainst: Math.round(xgAgainst * 100) / 100,
    form: buildForm(leagueFixtures, teamId),
    recentFixtures: finished.slice(0, 5),
  };
}

function chooseTeamLeague(fixtures: FixtureWithRelations[]) {
  const groups = new Map<
    string,
    { league: FixtureWithRelations["league"]; finished: number; latest: number }
  >();
  for (const fixture of fixtures) {
    const current = groups.get(fixture.league.id) ?? {
      league: fixture.league,
      finished: 0,
      latest: 0,
    };
    const time = new Date(fixture.kickoffAt).getTime();
    if (time > current.latest) current.latest = time;
    if (fixture.status === "finished") current.finished += 1;
    groups.set(fixture.league.id, current);
  }
  const chosen = [...groups.values()].sort((a, b) => {
    if (b.finished !== a.finished) return b.finished - a.finished;
    return b.latest - a.latest;
  })[0];
  return chosen?.league ?? sampleLeagues[0];
}

export async function listTeamFixtures(
  teamId: string,
  limit = 200,
  before?: string,
) {
  const beforeMs = before ? new Date(before).getTime() : null;
  if (!isSupabaseConfigured()) {
    return sampleFixtures
      .filter(
        (fixture) =>
          fixture.homeTeam.id === teamId || fixture.awayTeam.id === teamId,
      )
      .filter(
        (fixture) =>
          beforeMs == null || new Date(fixture.kickoffAt).getTime() < beforeMs,
      )
      .sort(
        (a, b) =>
          new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
      )
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("kickoff_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("kickoff_at", before);

  const { data, error } = await query;
  if (error || !data?.length) return [];

  return (data as unknown as FixtureRow[]).map((row) => mapFixture(row));
}

export async function winChancesByFixture(fixtures: FixtureWithRelations[]) {
  const leagueIds = [...new Set(fixtures.map((fixture) => fixture.league.id))];
  const leagues = await Promise.all(
    leagueIds.map(async (leagueId) => [leagueId, await listFixturesByLeague(leagueId)] as const),
  );
  const byLeague = new Map(leagues);
  const chances: Record<string, WinChances> = {};

  for (const fixture of fixtures) {
    const estimate = estimateWinChances(
      byLeague.get(fixture.league.id) ?? [],
      fixture.homeTeam.id,
      fixture.awayTeam.id,
      new Date(fixture.kickoffAt).getTime(),
    );
    if (estimate) chances[fixture.id] = estimate;
  }

  return chances;
}

export async function getMatchAnalysis(fixture: FixtureWithRelations) {
  const [leagueFixtures, homeFixtures, awayFixtures] = await Promise.all([
    listFixturesByLeague(fixture.league.id),
    listTeamFixtures(fixture.homeTeam.id, 30, fixture.kickoffAt),
    listTeamFixtures(fixture.awayTeam.id, 30, fixture.kickoffAt),
  ]);
  return runMatchPoints({ fixture, leagueFixtures, homeFixtures, awayFixtures });
}

export async function listFixturesByLeague(
  leagueId: string,
): Promise<FixtureWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return sampleFixtures.filter((fixture) => fixture.league.id === leagueId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .eq("league_id", leagueId)
    .order("kickoff_at", { ascending: true });

  if (error || !data?.length) return [];

  return (data as unknown as FixtureRow[]).map((row) => mapFixture(row));
}

const HONG_KONG = "Asia/Hong_Kong";

function hongKongDay(now: Date) {
  const label = new Intl.DateTimeFormat("zh-Hant", {
    timeZone: HONG_KONG,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: HONG_KONG,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = new Date(`${iso}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { label, start, end };
}

export async function listTodayFixtures(now: Date): Promise<{
  label: string;
  fixtures: FixtureWithRelations[];
}> {
  const day = hongKongDay(now);
  const inDay = (kickoffAt: string) => {
    const time = new Date(kickoffAt).getTime();
    return time >= day.start.getTime() && time < day.end.getTime();
  };

  if (!isSupabaseConfigured()) {
    return {
      label: day.label,
      fixtures: sampleFixtures.filter((fixture) => inDay(fixture.kickoffAt)),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .gte("kickoff_at", day.start.toISOString())
    .lt("kickoff_at", day.end.toISOString())
    .order("kickoff_at", { ascending: true });

  if (error || !data?.length) return { label: day.label, fixtures: [] };

  return {
    label: day.label,
    fixtures: (data as unknown as FixtureRow[]).map((row) => mapFixture(row)),
  };
}

function seasonYear(season: string) {
  const year = Number(season.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

export async function getPrimaryLeague() {
  const leagues = await listLeagues();
  const premier = leagues
    .filter((league) => league.name === "英格蘭超級聯賽")
    .sort((a, b) => seasonYear(b.season) - seasonYear(a.season));
  if (premier[0]) return premier[0];
  return (
    [...leagues].sort((a, b) => seasonYear(b.season) - seasonYear(a.season))[0] ??
    null
  );
}

export async function getMatchCenter(leagueId: string | undefined, now: number) {
  const requested = leagueId
    ? ((await listLeagues()).find((item) => item.id === leagueId) ?? null)
    : null;
  const league = requested ?? (await getPrimaryLeague());
  if (!league) return null;

  const fixtures = await listFixturesByLeague(league.id);
  const upcoming = fixtures
    .filter((fixture) => {
      if (fixture.status === "live") return true;
      if (fixture.status !== "scheduled") return false;
      if (!isSupabaseConfigured()) return true;
      return new Date(fixture.kickoffAt).getTime() >= now - 3 * 60 * 60 * 1000;
    })
    .sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    )
    .slice(0, 8);

  const recent = fixtures
    .filter((fixture) => fixture.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime(),
    )
    .slice(0, 8);

  return {
    league,
    upcoming,
    recent,
    round: currentRoundLabel(fixtures),
    table: buildTable(fixtures) satisfies StandingRow[],
  };
}
