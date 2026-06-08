import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import {
  getEstimate,
  NotFoundError,
} from "@/server/modules/estimate/estimate.service";
import {
  sendEstimateAction,
  convertEstimateAction,
  deleteEstimateItemAction,
} from "@/server/modules/estimate/actions";
import { formatMoney } from "@/server/lib/money";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { EstimateBadge } from "@/components/ui/status-badge";
import { t, lineItemTypeTh } from "@/i18n";
import { AddItemForm } from "./add-item-form";

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("estimate", "read");
  const { id } = await params;

  const est = await getEstimate(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  const canUpdate = can(ctx.role, "estimate", "update");
  const isDraft = est.status === "DRAFT";

  // Build the public approval URL from the incoming request.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "";
  const approvalUrl = est.approvalToken
    ? `${proto}://${host}/portal/estimates/${est.approvalToken}`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t.estimate.title} #${est.number}`}
        subtitle={est.customer.name}
        action={
          <div className="flex items-center gap-2">
            <EstimateBadge status={est.status} />
            {canUpdate && isDraft && est.lineItems.length > 0 && (
              <form action={sendEstimateAction}>
                <input type="hidden" name="id" value={id} />
                <button className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
                  {t.estimate.markSent}
                </button>
              </form>
            )}
            {canUpdate && est.status === "APPROVED" && (
              <form action={convertEstimateAction}>
                <input type="hidden" name="id" value={id} />
                <button className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
                  {t.estimate.convertToJob}
                </button>
              </form>
            )}
          </div>
        }
      />

      {approvalUrl && est.status === "SENT" && (
        <Card title={t.estimate.approvalLink}>
          <p className="mb-2 text-xs text-foreground/50">
            {t.estimate.approvalHint}
          </p>
          <code className="block break-all rounded-md bg-black/5 p-2 text-xs dark:bg-white/10">
            {approvalUrl}
          </code>
        </Card>
      )}

      <Card>
        {est.lineItems.length === 0 ? (
          <EmptyState>{t.estimate.noItems}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-1 font-medium">{t.type}</th>
                <th className="px-2 py-1 font-medium">{t.description}</th>
                <th className="px-2 py-1 text-right font-medium">{t.qty}</th>
                <th className="px-2 py-1 text-right font-medium">{t.unit}</th>
                <th className="px-2 py-1 text-right font-medium">{t.total}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {est.lineItems.map((li) => (
                <tr
                  key={li.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-2 py-1 text-foreground/60">
                    {lineItemTypeTh[li.type]}
                  </td>
                  <td className="px-2 py-1">{li.description}</td>
                  <td className="px-2 py-1 text-right">{Number(li.quantity)}</td>
                  <td className="px-2 py-1 text-right">
                    {formatMoney(li.unitPriceCents)}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {formatMoney(
                      Math.round(Number(li.quantity) * li.unitPriceCents),
                    )}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {canUpdate && isDraft && (
                      <form action={deleteEstimateItemAction}>
                        <input type="hidden" name="id" value={li.id} />
                        <input type="hidden" name="estimateId" value={id} />
                        <button className="text-foreground/40 hover:text-red-600">
                          ✕
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-black/10 dark:border-white/10">
              <tr>
                <td colSpan={4} className="px-2 py-1 text-right text-foreground/60">
                  {t.subtotal}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatMoney(est.subtotalCents)}
                </td>
                <td />
              </tr>
              <tr>
                <td colSpan={4} className="px-2 py-1 text-right text-foreground/60">
                  {t.tax}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatMoney(est.taxCents)}
                </td>
                <td />
              </tr>
              <tr className="font-semibold">
                <td colSpan={4} className="px-2 py-1 text-right">
                  {t.estimate.total}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatMoney(est.totalCents)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
        {canUpdate && isDraft && (
          <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
            <AddItemForm estimateId={id} />
          </div>
        )}
      </Card>

      <Link
        href="/estimates"
        className="inline-block text-sm text-foreground/60 hover:underline"
      >
        {t.estimate.backToEstimates}
      </Link>
    </div>
  );
}
