import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { NAV } from "@/config/nav";
import { PageHeader } from "@/components/ui/primitives";
import { t } from "@/i18n";

export default async function DashboardPage() {
  const user = await requireUser();
  const tiles = NAV.filter(
    (n) => n.href !== "/dashboard" && can(user.role, n.resource, "read"),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t.dashboard} subtitle={t.dashboardSubtitle} />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <div className="text-sm font-medium">{item.label}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
