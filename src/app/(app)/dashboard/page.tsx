import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { NAV } from "@/config/nav";
import { getAlerts } from "@/server/modules/report/report.service";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { t } from "@/i18n";

function AlertRow({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  if (count === 0) return null;
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm hover:bg-amber-500/10"
    >
      <span>{label}</span>
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        {count} {t.report.items}
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const tiles = NAV.filter(
    (n) => n.href !== "/dashboard" && can(user.role, n.resource, "read"),
  );

  const showAlerts = can(user.role, "report", "read");
  const alerts = showAlerts ? await getAlerts(user) : null;
  const hasAlerts =
    alerts &&
    (alerts.overdueInvoices ||
      alerts.lowStockParts ||
      alerts.dueContracts ||
      alerts.unscheduledJobs);

  return (
    <div className="space-y-6">
      <PageHeader title={t.dashboard} subtitle={t.dashboardSubtitle} />

      {alerts && (
        <Card title={t.report.alerts}>
          {!hasAlerts ? (
            <EmptyState>{t.report.nothingUrgent}</EmptyState>
          ) : (
            <div className="space-y-2">
              <AlertRow label={t.report.overdueInvoices} count={alerts.overdueInvoices} href="/invoices?status=SENT" />
              <AlertRow label={t.report.unscheduledJobs} count={alerts.unscheduledJobs} href="/schedule" />
              <AlertRow label={t.report.dueContracts} count={alerts.dueContracts} href="/contracts" />
              <AlertRow label={t.report.lowStockParts} count={alerts.lowStockParts} href="/inventory?low=1" />
            </div>
          )}
        </Card>
      )}

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
