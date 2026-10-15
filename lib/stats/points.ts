import type { AnalysisBar, AnalysisContext, AnalysisRow } from "@/lib/stats/analysis";
import {
  buildMatchBriefing,
  scoreModelExpectedGoals,
  type MatchBriefing,
} from "@/lib/stats/briefing";
import { scheduleRows, shotRows } from "@/lib/stats/match-profile";

export type AnalysisPointResult = {
  id: string;
  title: string;
  summary: string;
  bars: AnalysisBar[];
  rows: AnalysisRow[];
  homeName: string;
  awayName: string;
  briefing: MatchBriefing | null;
};

type AnalysisPoint = {
  id: string;
  title: string;
  run: (context: AnalysisContext) => Omit<AnalysisPointResult, "id" | "title"> | null;
};

function namesOf(context: AnalysisContext) {
  return {
    homeName: context.fixture.homeTeam.name,
    awayName: context.fixture.awayTeam.name,
  };
}

function rate(value: number | null, games: number) {
  if (value == null || games === 0) return "—";
  return `${value.toFixed(2)}（${games} 場）`;
}

const preMatchPoint: AnalysisPoint = {
  id: "pre-match",
  title: "賽前對照",
  run(context) {
    return {
      summary: "排名與近況只計本聯賽。休息只計已同步賽事。",
      bars: [],
      rows: [],
      ...namesOf(context),
      briefing: buildMatchBriefing(context),
    };
  },
};

const expectedGoalsPoint: AnalysisPoint = {
  id: "expected-goals",
  title: "預期進球",
  run(context) {
    const { fixture, leagueFixtures } = context;
    const model = scoreModelExpectedGoals(
      leagueFixtures,
      fixture.homeTeam.id,
      fixture.awayTeam.id,
      new Date(fixture.kickoffAt).getTime(),
    );
    if (!model) return null;
    const edge =
      model.lambdaHome >= model.lambdaAway + 0.35
        ? `${fixture.homeTeam.name}這場的預期進球較高。`
        : model.lambdaAway >= model.lambdaHome + 0.35
          ? `${fixture.awayTeam.name}這場的預期進球較高。`
          : "兩隊這場的預期進球接近。";
    return {
      summary: `由本季完賽的進失球估算，不是射門位置算出的 xG。${edge} 沒有逐次射門時，不計算無點球 xG、射後 xG、預期助攻、壓迫強度和推進傳球。`,
      bars: [],
      rows: [
        {
          label: "預期進球",
          kind: "estimate",
          home: model.lambdaHome.toFixed(2),
          away: model.lambdaAway.toFixed(2),
        },
        {
          label: "場均進球",
          kind: "record",
          home: rate(model.homeFor, model.homePlayed),
          away: rate(model.awayFor, model.awayPlayed),
        },
        {
          label: "場均失球",
          kind: "record",
          home: rate(model.homeAgainst, model.homePlayed),
          away: rate(model.awayAgainst, model.awayPlayed),
        },
        {
          label: "本場場地進球",
          kind: "record",
          home: rate(model.homeVenueFor, model.homeVenuePlayed),
          away: rate(model.awayVenueFor, model.awayVenuePlayed),
        },
        {
          label: "本場場地失球",
          kind: "record",
          home: rate(model.homeVenueAgainst, model.homeVenuePlayed),
          away: rate(model.awayVenueAgainst, model.awayVenuePlayed),
        },
      ],
      ...namesOf(context),
      briefing: null,
    };
  },
};

const schedulePoint: AnalysisPoint = {
  id: "schedule",
  title: "賽程負荷",
  run(context) {
    const rows = scheduleRows(context);
    const homeWeek = Number.parseInt(rows[1]?.home ?? "0", 10);
    const awayWeek = Number.parseInt(rows[1]?.away ?? "0", 10);
    const crowded = homeWeek >= 3 || awayWeek >= 3;
    return {
      summary: crowded
        ? "休息與完賽場次只計已同步賽事。近 7 日有一方至少完賽 3 場，體能是變數。"
        : "休息與完賽場次只計已同步賽事。",
      bars: [],
      rows,
      ...namesOf(context),
      briefing: null,
    };
  },
};

const shotsPoint: AnalysisPoint = {
  id: "shots",
  title: "射門與期望進球",
  run(context) {
    const rows = shotRows(context);
    if (!rows) return null;
    return {
      summary: "只計本聯賽、開球前已有射門或 xG 紀錄的完賽。",
      bars: [],
      rows,
      ...namesOf(context),
      briefing: null,
    };
  },
};

/** 陣列順序就是比賽頁上的順序。樣本不足時 run 回傳 null，該點不會出現。 */
export const matchPoints: AnalysisPoint[] = [
  preMatchPoint,
  expectedGoalsPoint,
  schedulePoint,
  shotsPoint,
];

export function runMatchPoints(context: AnalysisContext): AnalysisPointResult[] {
  return matchPoints.flatMap((point) => {
    const result = point.run(context);
    if (!result) return [];
    return [{ id: point.id, title: point.title, ...result }];
  });
}
