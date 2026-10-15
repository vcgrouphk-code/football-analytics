import { isSupabaseConfigured } from "@/lib/utils/env";

export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-amber-900/50 bg-amber-950/40 px-6 py-3 text-sm text-amber-100">
      目前使用<strong className="mx-1 font-medium">示範資料</strong>
      。請複製 <code className="rounded bg-black/30 px-1">.env.example</code>{" "}
      為 <code className="rounded bg-black/30 px-1">.env.local</code>{" "}
      並填入 Supabase 後即可連接真實資料庫。
    </div>
  );
}
