import type { TeamSummary } from "@/types/football";

export function TeamCrest({ team, className = "h-5 w-5" }: { team: TeamSummary; className?: string }) {
  if (team.logoUrl) {
    return (
      // 外部隊徽網址不經圖片優化，避免逐張設定遠端網域。
      // eslint-disable-next-line @next/next/no-img-element
      <img src={team.logoUrl} alt="" className={`${className} object-contain`} />
    );
  }

  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-400`}
    >
      {team.name.slice(0, 1)}
    </span>
  );
}
