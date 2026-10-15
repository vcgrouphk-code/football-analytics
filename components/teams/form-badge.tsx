import type { TeamFormResult } from "@/types/football";
import { cn } from "@/lib/utils/cn";

const colors: Record<TeamFormResult, string> = {
  W: "bg-emerald-600 text-white",
  D: "bg-zinc-600 text-white",
  L: "bg-rose-600 text-white",
};

const label: Record<TeamFormResult, string> = {
  W: "勝",
  D: "和",
  L: "負",
};

export function FormBadge({
  form,
  emptyLabel = "尚無近期賽事",
}: {
  form: TeamFormResult[];
  emptyLabel?: string;
}) {
  if (!form.length) {
    return <span className="text-xs text-zinc-500">{emptyLabel}</span>;
  }

  return (
    <div className="flex gap-1">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold",
            colors[result],
          )}
        >
          {label[result]}
        </span>
      ))}
    </div>
  );
}
