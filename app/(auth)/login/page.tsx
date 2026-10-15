import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/utils/env";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-emerald-400 hover:underline">
            PitchMetrics
          </Link>
          <h1 className="mt-4 text-2xl font-bold">登入</h1>
          <p className="mt-2 text-sm text-zinc-500">
            使用 Magic Link 登入以同步收藏與個人設定
          </p>
        </div>
        <LoginForm supabaseReady={isSupabaseConfigured()} />
      </div>
    </div>
  );
}
