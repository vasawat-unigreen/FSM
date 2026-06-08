import Link from "next/link";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { listEstimates } from "@/server/modules/estimate/estimate.service";
import { formatMoney } from "@/server/lib/money";
import { PageHeader, Card, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { EstimateBadge } from "@/components/ui/status-badge";
import { t } from "@/i18n";

export default async function EstimatesPage() {
  const ctx = await requirePermission("estimate", "read");
  const estimates = await listEstimates(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.estimate.title}
        subtitle={`${estimates.length} ${t.shown}`}
        action={
          can(ctx.role, "estimate", "create") ? (
            <ButtonLink href="/estimates/new">{t.estimate.create}</ButtonLink>
          ) : undefined
        }
      />
      <Card>
        {estimates.length === 0 ? (
          <EmptyState>{t.estimate.noEstimates}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-2 font-medium">{t.estimate.number}</th>
                <th className="px-2 py-2 font-medium">{t.estimate.customer}</th>
                <th className="px-2 py-2 text-right font-medium">
                  {t.estimate.total}
                </th>
                <th className="px-2 py-2 font-medium">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-2 py-2">
                    <Link
                      href={`/estimates/${e.id}`}
                      className="font-medium hover:underline"
                    >
                      #{e.number}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-foreground/70">
                    {e.customer.name}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {formatMoney(e.totalCents)}
                  </td>
                  <td className="px-2 py-2">
                    <EstimateBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
