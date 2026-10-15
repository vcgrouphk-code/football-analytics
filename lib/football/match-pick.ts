import type { FixtureStatus } from "@/types/database";

export type MatchPickChoice = "home" | "draw" | "away";

export const MATCH_PICK_LABEL: Record<MatchPickChoice, string> = {
  home: "主勝",
  draw: "和局",
  away: "客勝",
};

export function matchOutcome(home: number, away: number): MatchPickChoice {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function matchPickVerdict(
  choice: MatchPickChoice | "",
  status: FixtureStatus,
  homeScore: number | null,
  awayScore: number | null,
) {
  if (status === "postponed" || status === "cancelled") {
    return { text: "本場不結算", tone: "void" as const };
  }

  const settled = status === "finished" && homeScore != null && awayScore != null;
  if (!settled) {
    return {
      text: choice ? "完場後揭曉" : "選好後，完場揭曉",
      tone: "pending" as const,
    };
  }

  const score = `${homeScore}-${awayScore}`;
  if (!choice) return { text: `賽果 ${score}`, tone: "result" as const };
  const outcome = matchOutcome(homeScore, awayScore);
  if (choice === outcome) return { text: `命中 · ${score}`, tone: "hit" as const };
  return { text: `未中 · ${score}`, tone: "miss" as const };
}
