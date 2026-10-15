import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils/env";

export async function getLatestSyncAt() {
  if (!isSupabaseConfigured()) return null;
  if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("sync_logs")
      .select("finished_at, started_at")
      .eq("status", "ok")
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data.finished_at ?? data.started_at;
  } catch {
    return null;
  }
}
