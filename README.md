# PitchMetrics · 足球專業分析

Next.js 16、TypeScript、Tailwind CSS 4 與 Supabase 建構的足球分析 MVP（Phase 1）。

## 功能

- **分析總覽**：近期與即將進行的賽事
- **單場深度頁**：xG 圖表、射門、控球等（有 stats 時）
- **球隊頁**：Form、戰績、xG 差、近期比賽
- **聯賽列表**：依聯賽瀏覽賽程
- **登入**：Supabase Magic Link（需設定環境變數）
- **資料同步**：`POST /api/sync` 從 API-Football 拉取賽程（需 Service Role 與 API Key）

未設定 Supabase 時會自動使用 **示範資料**（英超範例）。

## 開始使用

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

瀏覽 [http://localhost:3000](http://localhost:3000) → 「進入分析台」。

## Supabase 設定

1. 在 [Supabase](https://supabase.com) 建立專案。
2. 於 SQL Editor 執行 `supabase/migrations/20251014000000_initial_schema.sql`。
3. 在 **Authentication → URL Configuration** 加入：
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. 將 **Project URL**、**anon key**、**service_role key** 填入 `.env.local`。

## 同步外部賽事（選用）

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer 你的CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"leagueId\": 39, \"season\": 2025}"
```

預設 `leagueId=39` 為英超。需設定 `FOOTBALL_API_KEY`（[API-Football](https://www.api-football.com/)）。

## 專案結構

```
app/
  (marketing)/     首頁
  (dashboard)/     分析台（總覽、聯賽、賽事、球隊）
  (auth)/login/    登入
  api/sync/        賽程同步
components/        UI 與圖表
lib/
  data/            查詢層 + 示範資料
  stats/           Form 等純函式
  supabase/        客戶端
  football/        第三方 API
supabase/migrations/
types/
```

## 後續 Phase 2 建議

- 進階篩選與 CSV/PDF 匯出
- xG 賽季趨勢圖、對賽 H2H 專區
- 收藏球隊（`favorites` 表已建立）
- Supabase Edge Function + pg_cron 定時同步

## 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置 |
| `npm run lint` | ESLint |
