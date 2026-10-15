/**
 * 第三方賽事 API 客戶端（預設 API-Football 格式）。
 * 僅供伺服器端同步使用，請勿在前端暴露 API Key。
 */

const DEFAULT_BASE = "https://v3.football.api-sports.io";

export type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
    venue?: { name?: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    round?: string;
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
};

function mapStatus(short: string): "scheduled" | "live" | "finished" | "postponed" | "cancelled" {
  if (["NS", "TBD"].includes(short)) return "scheduled";
  if (["1H", "2H", "HT", "ET", "P", "LIVE"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["PST"].includes(short)) return "postponed";
  if (["CANC", "ABD"].includes(short)) return "cancelled";
  return "scheduled";
}

export function getApiFootballConfig() {
  const baseUrl = process.env.FOOTBALL_API_BASE_URL ?? DEFAULT_BASE;
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_API_KEY 未設定");
  }
  return { baseUrl, apiKey };
}

export async function fetchLeagueFixtures(
  leagueExternalId: number,
  season: number,
): Promise<ApiFootballFixture[]> {
  const { baseUrl, apiKey } = getApiFootballConfig();
  const url = new URL(`${baseUrl}/fixtures`);
  url.searchParams.set("league", String(leagueExternalId));
  url.searchParams.set("season", String(season));

  const res = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`API-Football 錯誤: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { response?: ApiFootballFixture[] };
  return json.response ?? [];
}

export { mapStatus };
