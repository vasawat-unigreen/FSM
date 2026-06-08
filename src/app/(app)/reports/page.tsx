import { requirePermission } from "@/server/lib/auth";
import { getKpis } from "@/server/modules/report/report.service";
import { formatMoney } from "@/server/lib/money";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { t } from "@/i18n";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="text-xs text-foreground/50">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export default async function ReportsPage() {
  const ctx = await requirePermission("report", "read");
  const k = await getKpis(ctx);

  return (
    <div className="space-y-6">
      <PageHeader title={t.report.title} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label={t.report.revenueMonth} value={formatMoney(k.revenueMonthCents)} />
        <Kpi label={t.report.revenueTotal} value={formatMoney(k.revenueTotalCents)} />
        <Kpi label={t.report.outstanding} value={formatMoney(k.outstandingCents)} />
        <Kpi label={t.report.openJobs} value={String(k.openJobs)} />
        <Kpi label={t.report.completedMonth} value={String(k.completedThisMonth)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t.report.jobsByStatus}>
          {k.jobsByStatus.length === 0 ? (
            <EmptyState>—</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {k.jobsByStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between">
                  <StatusBadge status={row.status} />
                  <span className="font-medium">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t.report.topCustomers}>
          {k.topCustomers.length === 0 ? (
            <EmptyState>—</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {k.topCustomers.map((c, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-foreground/80">{c.name}</span>
                  <span className="font-medium">{formatMoney(c.cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t.report.techWorkload}>
          {k.techWorkload.length === 0 ? (
            <EmptyState>—</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {k.techWorkload.map((tw, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-foreground/80">{tw.name}</span>
                  <span className="font-medium">
                    {tw.count} {t.report.jobs}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
