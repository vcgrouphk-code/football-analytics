import type { FixtureWithRelations } from "@/types/football";

/** 一場比賽的分析都讀這包資料，分析點本身不再查資料庫。 */
export type AnalysisContext = {
  fixture: FixtureWithRelations;
  leagueFixtures: FixtureWithRelations[];
  homeFixtures: FixtureWithRelations[];
  awayFixtures: FixtureWithRelations[];
};

export type AnalysisBar = {
  label: string;
  value: number;
};

export type AnalysisRow = {
  label: string;
  home: string;
  away: string;
  /** 缺省當紀錄。估算是模型算出來的，不是數據源公布的數字。 */
  kind?: "record" | "estimate";
  note?: string;
};
