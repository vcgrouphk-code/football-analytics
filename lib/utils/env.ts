/** 瀏覽器可用的 publishable key，或舊版 anon key。 */
export function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabaseKey());
}

export function hasFootballApiKey() {
  return Boolean(process.env.FOOTBALL_API_KEY);
}

export function getFootballDataToken() {
  return process.env.FOOTBALL_DATA_TOKEN || process.env.FOOTBALL_DATA_API_TOKEN;
}

export function hasFootballDataToken() {
  return Boolean(getFootballDataToken());
}
