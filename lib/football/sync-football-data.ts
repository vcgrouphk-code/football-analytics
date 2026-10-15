import { createServiceClient } from "@/lib/supabase/server";
import {
  fetchCompetition,
  fetchCompetitionMatches,
  mapFootballDataStatus,
  type FootballDataTeam,
} from "@/lib/football/football-data";

const PROVIDER = "football-data";

export async function syncFootballDataLeague(code = "PL") {
  const competition = await fetchCompetition(code);
  const season =
    competition.currentSeason?.startDate?.slice(0, 4) ??
    String(new Date().getUTCFullYear());
  const payload = await fetchCompetitionMatches(code, season);
  const matches = payload.matches ?? [];

  if (!matches.length) {
    return { upserted: 0, season, competition: competition.name, warning: "API 未回傳賽事" };
  }

  const supabase = await createServiceClient();
  const { data: leagueRow, error: leagueError } = await supabase
    .from("leagues")
    .upsert(
      {
        external_id: payload.competition?.code ?? competition.code ?? code,
        provider: PROVIDER,
        name: payload.competition?.name ?? competition.name,
        country: competition.area?.name ?? null,
        season,
        logo_url: payload.competition?.emblem ?? competition.emblem ?? null,
      },
      { onConflict: "provider,external_id,season" },
    )
    .select("id")
    .single();

  if (leagueError || !leagueRow) {
    throw leagueError ?? new Error("無法 upsert 聯賽");
  }

  const teams = new Map<number, FootballDataTeam>();
  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (team?.id && team.name) teams.set(team.id, team);
    }
  }

  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .upsert(
      [...teams.values()].map((team) => ({
        external_id: String(team.id),
        provider: PROVIDER,
        name: team.name,
        short_name: team.tla ?? team.shortName ?? null,
        logo_url: team.crest ?? null,
      })),
      { onConflict: "provider,external_id" },
    )
    .select("id, external_id");

  if (teamError || !teamRows) {
    throw teamError ?? new Error("無法 upsert 球隊");
  }

  const teamIds = new Map(teamRows.map((team) => [team.external_id, team.id]));
  const fixtureRows = matches.flatMap((match) => {
    if (!match.homeTeam?.id || !match.awayTeam?.id) return [];
    const homeId = teamIds.get(String(match.homeTeam.id));
    const awayId = teamIds.get(String(match.awayTeam.id));
    if (!homeId || !awayId) return [];
    return [
      {
        external_id: String(match.id),
        provider: PROVIDER,
        league_id: leagueRow.id,
        home_team_id: homeId,
        away_team_id: awayId,
        kickoff_at: match.utcDate,
        status: mapFootballDataStatus(match.status),
        home_score: match.score?.fullTime?.home ?? null,
        away_score: match.score?.fullTime?.away ?? null,
        venue: match.venue ?? null,
        round: match.matchday ? `第 ${match.matchday} 輪` : null,
      },
    ];
  });

  let upserted = 0;
  for (let index = 0; index < fixtureRows.length; index += 100) {
    const chunk = fixtureRows.slice(index, index + 100);
    const { error } = await supabase.from("fixtures").upsert(chunk, {
      onConflict: "provider,external_id",
    });
    if (error) throw error;
    upserted += chunk.length;
  }

  await supabase.from("sync_logs").insert({
    provider: PROVIDER,
    job_name: "fixtures",
    status: "ok",
    message: `Upserted ${upserted} ${code} ${season} fixtures`,
    finished_at: new Date().toISOString(),
  });

  return { upserted, season, competition: competition.name };
}

const syncState = globalThis as typeof globalThis & {
  __pitchmetricsSyncRunning?: boolean;
};

const COMPETITION_GAP_MS = 13_000;

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return "Unknown error";
}

/** 同步資料庫裡已有的 football-data 聯賽。每聯賽兩次請求，中間留空以免超過免費額度。 */
export async function syncTrackedFootballData() {
  if (syncState.__pitchmetricsSyncRunning) {
    return { skipped: true as const, competitions: [] };
  }

  syncState.__pitchmetricsSyncRunning = true;
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("leagues")
      .select("external_id")
      .eq("provider", PROVIDER);

    if (error) throw error;

    const codes = [...new Set((data ?? []).map((row) => row.external_id))];
    const competitions: Array<
      | { code: string; upserted: number; season: string; competition: string; warning?: string }
      | { code: string; error: string }
    > = [];

    for (let index = 0; index < codes.length; index += 1) {
      const code = codes[index];
      try {
        competitions.push({ code, ...(await syncFootballDataLeague(code)) });
      } catch (error) {
        const message = errorMessage(error);
        competitions.push({ code, error: message });
        if (message.includes("429")) break;
      }

      if (index < codes.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, COMPETITION_GAP_MS));
      }
    }

    return { skipped: false as const, competitions };
  } finally {
    syncState.__pitchmetricsSyncRunning = false;
  }
}
