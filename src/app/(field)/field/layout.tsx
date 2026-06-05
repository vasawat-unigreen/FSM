import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { logoutAction } from "@/server/modules/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n";
import { ServiceWorkerRegister } from "./sw-register";

// Mobile-first shell for technicians in the field — no desktop sidebar,
// big touch targets, single column.
export default async function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const showOffice = can(user.role, "settings", "read");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <ServiceWorkerRegister />
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-background/90 px-4 py-3 backdrop-blur dark:border-white/10">
        <Link href="/field" className="text-lg font-semibold tracking-tight">
          {t.field.title}
        </Link>
        <div className="flex items-center gap-3 text-sm text-foreground/60">
          {showOffice && (
            <Link href="/dashboard" className="underline">
              {t.field.office}
            </Link>
          )}
          <ThemeToggle />
          <span>{user.name}</span>
          <form action={logoutAction}>
            <button type="submit" className="underline">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
