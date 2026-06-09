import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { logoutAction } from "@/server/modules/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n";

// Mode chooser shown after login: pick the desktop (office) or mobile (field)
// experience. Reached on every sign-in and from the app root.
export default async function ChoosePage() {
  const user = await requireUser();

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-4 top-4 flex items-center gap-3 text-sm text-foreground/60">
        <ThemeToggle />
        <form action={logoutAction}>
          <button type="submit" className="underline">
            {t.signOut}
          </button>
        </form>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight">FSM</div>
          <p className="mt-1 text-foreground/60">
            {t.choose.greeting} {user.name} · {user.tenantName}
          </p>
          <h1 className="mt-4 text-lg font-medium">{t.choose.heading}</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="group rounded-2xl border border-black/10 p-6 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            <div className="text-4xl">🖥️</div>
            <div className="mt-3 text-lg font-semibold">
              {t.choose.desktop}
            </div>
            <p className="mt-1 text-sm text-foreground/60">
              {t.choose.desktopHint}
            </p>
          </Link>

          <Link
            href="/field"
            className="group rounded-2xl border border-black/10 p-6 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            <div className="text-4xl">📱</div>
            <div className="mt-3 text-lg font-semibold">{t.choose.mobile}</div>
            <p className="mt-1 text-sm text-foreground/60">
              {t.choose.mobileHint}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
