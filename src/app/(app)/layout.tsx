import Link from "next/link";
import { NAV } from "@/config/nav";
import { requireUser } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { logoutAction } from "@/server/modules/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { t, roleTh } from "@/i18n";

// Authed app shell: sidebar + top bar + content. Guarded by requireUser and
// the nav is filtered to what the current role may read (skills.md §5).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const items = NAV.filter((item) => can(user.role, item.resource, "read"));

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-black/10 bg-black/[.02] dark:border-white/10 dark:bg-white/[.02]">
        <div className="px-5 py-4 text-lg font-semibold tracking-tight">
          FSM
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
          <span className="text-sm text-foreground/60">{user.tenantName}</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/60">
              {user.name} · {roleTh[user.role]}
            </span>
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-foreground/60 underline hover:text-foreground"
              >
                {t.signOut}
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
