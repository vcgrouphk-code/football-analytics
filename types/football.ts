import type { FixtureStatus } from "./database";

export type TeamSummary = {
  id: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
};

export type LeagueSummary = {
  id: string;
  name: string;
  country?: string | null;
  season: string;
  logoUrl?: string | null;
  provider?: string | null;
};

export type StandingRow = {
  rank: number;
  team: TeamSummary;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: TeamFormResult[];
};

export type FixtureWithRelations = {
  id: string;
  kickoffAt: string;
  status: FixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
  venue?: string | null;
  round?: string | null;
  league: LeagueSummary;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  stats?: FixtureStats | null;
};

export type FixtureStats = {
  homeXg: number | null;
  awayXg: number | null;
  homeShots: number | null;
  awayShots: number | null;
  homeShotsOnTarget: number | null;
  awayShotsOnTarget: number | null;
  homePossession: number | null;
  awayPossession: number | null;
  homeCorners: number | null;
  awayCorners: number | null;
};

export type TeamFormResult = "W" | "D" | "L";

export type TeamSeasonSnapshot = {
  team: TeamSummary;
  league: LeagueSummary;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  xgFor: number;
  xgAgainst: number;
  form: TeamFormResult[];
  recentFixtures: FixtureWithRelations[];
};
