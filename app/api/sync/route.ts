import { connection, NextResponse } from "next/server";
import {
  fetchLeagueFixtures,
  mapStatus,
} from "@/lib/football/api-football";
import {
  syncFootballDataLeague,
  syncTrackedFootballData,
} from "@/lib/football/sync-football-data";
import { createServiceClient } from "@/lib/supabase/server";
import {
  hasFootballApiKey,
  hasFootballDataToken,
  isSupabaseConfigured,
} from "@/lib/utils/env";

/** 預設同步英超 (API-Football league id 39) */
const DEFAULT_LEAGUE_ID = 39;
const DEFAULT_SEASON = 2025;

export const maxDuration = 300;

function unauthorized(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function syncFootballData(competition?: string) {
  if (!hasFootballDataToken()) {
    return NextResponse.json(
      {
        error:
          "請設定 FOOTBALL_DATA_TOKEN（https://www.football-data.org/client/register）",
      },
      { status: 503 },
    );
  }

  try {
    if (competition) {
      const result = await syncFootballDataLeague(competition);
      return NextResponse.json({ ok: true, source: "football-data", ...result });
    }

    const result = await syncTrackedFootballData();
    return NextResponse.json({ ok: true, source: "football-data", ...result });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e && "message" in e
          ? String(e.message)
          : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  await connection();
  const denied = unauthorized(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "請設定 Supabase（參考 .env.example）" },
      { status: 503 },
    );
  }
  return syncFootballData();
}

export async function POST(request: Request) {
  await connection();
  const denied = unauthorized(request);
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "請設定 Supabase（參考 .env.example）" },
      { status: 503 },
    );
  }

  let body: { leagueId?: number; season?: number; provider?: string; competition?: string } =
    {};
  try {
    body = await request.json();
  } catch {
    // empty body ok
  }

  const useFootballData =
    body.provider === "football-data" ||
    (body.provider !== "api-football" && hasFootballDataToken());

  if (useFootballData) {
    return syncFootballData(body.competition);
  }

  if (!hasFootballApiKey()) {
    return NextResponse.json(
      { error: "請設定 FOOTBALL_DATA_TOKEN 或 FOOTBALL_API_KEY" },
      { status: 503 },
    );
  }

  const leagueExternalId = body.leagueId ?? DEFAULT_LEAGUE_ID;
  const season = body.season ?? DEFAULT_SEASON;

  try {
    const fixtures = await fetchLeagueFixtures(leagueExternalId, season);

    if (!fixtures.length) {
      return NextResponse.json({
        ok: true,
        upserted: 0,
        warning: "API 未回傳賽事",
      });
    }

    const supabase = await createServiceClient();

    const { data: leagueRow, error: leagueError } = await supabase
      .from("leagues")
      .upsert(
        {
          external_id: String(leagueExternalId),
          provider: "api-football",
          name: fixtures[0]?.league.name ?? `League ${leagueExternalId}`,
          country: fixtures[0]?.league.country ?? null,
          season: String(season),
        },
        { onConflict: "provider,external_id,season" },
      )
      .select("id")
      .single();

    if (leagueError || !leagueRow) {
      throw leagueError ?? new Error("無法 upsert 聯賽");
    }

    let upserted = 0;

    for (const item of fixtures) {
      const upsertTeam = async (externalId: number, name: string) => {
        const { data } = await supabase
          .from("teams")
          .upsert(
            {
              external_id: String(externalId),
              provider: "api-football",
              name,
            },
            { onConflict: "provider,external_id" },
          )
          .select("id")
          .single();
        return data?.id;
      };

      const homeId = await upsertTeam(
        item.teams.home.id,
        item.teams.home.name,
      );
      const awayId = await upsertTeam(
        item.teams.away.id,
        item.teams.away.name,
      );

      if (!homeId || !awayId) continue;

      const { error: fxError } = await supabase.from("fixtures").upsert(
        {
          external_id: String(item.fixture.id),
          provider: "api-football",
          league_id: leagueRow.id,
          home_team_id: homeId,
          away_team_id: awayId,
          kickoff_at: item.fixture.date,
          status: mapStatus(item.fixture.status.short),
          home_score: item.goals.home,
          away_score: item.goals.away,
          venue: item.fixture.venue?.name ?? null,
          round: item.league.round ?? null,
        },
        { onConflict: "provider,external_id" },
      );

      if (!fxError) upserted++;
    }

    await supabase.from("sync_logs").insert({
      provider: "api-football",
      job_name: "fixtures",
      status: "ok",
      message: `Upserted ${upserted} fixtures`,
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, upserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
