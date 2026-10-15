import type { FixtureStatus } from "@/types/database";
import { getFootballDataToken } from "@/lib/utils/env";

const BASE_URL = "https://api.football-data.org/v4";

export type FootballDataTeam = {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  venue?: string | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: { home: number | null; away: number | null };
  };
};

export type FootballDataMatches = {
  competition: {
    id: number;
    name: string;
    code: string;
    emblem?: string | null;
  };
  filters?: { season?: string };
  matches: FootballDataMatch[];
};

export type FootballDataCompetition = {
  name: string;
  code: string;
  emblem?: string | null;
  area?: { name?: string | null };
  currentSeason?: { startDate?: string };
};

function mapStatus(status: string): FixtureStatus {
  if (["SCHEDULED", "TIMED"].includes(status)) return "scheduled";
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(status)) return "live";
  if (["FINISHED", "AWARDED"].includes(status)) return "finished";
  if (["POSTPONED", "SUSPENDED"].includes(status)) return "postponed";
  if (status === "CANCELLED") return "cancelled";
  return "scheduled";
}

async function footballDataGet<T>(path: string): Promise<T> {
  const token = getFootballDataToken();
  if (!token) {
    throw new Error("缺少 FOOTBALL_DATA_TOKEN");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`football-data.org ${response.status}: ${detail}`);
  }

  return (await response.json()) as T;
}

export async function fetchCompetition(code = "PL") {
  return footballDataGet<FootballDataCompetition>(`/competitions/${code}`);
}

export async function fetchCompetitionMatches(code = "PL", season?: string) {
  const query = season ? `?season=${season}` : "";
  return footballDataGet<FootballDataMatches>(
    `/competitions/${code}/matches${query}`,
  );
}

export { mapStatus as mapFootballDataStatus };
