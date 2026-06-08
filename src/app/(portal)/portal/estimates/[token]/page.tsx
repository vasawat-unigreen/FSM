import { getEstimateByToken } from "@/server/modules/estimate/estimate.service";
import { portalDecisionAction } from "@/server/modules/estimate/actions";
import { formatMoney } from "@/server/lib/money";
import { Card, EmptyState } from "@/components/ui/primitives";
import { t, lineItemTypeTh } from "@/i18n";

export default async function PortalEstimatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const est = await getEstimateByToken(token);

  if (!est) {
    return <EmptyState>{t.estimate.portalNotFound}</EmptyState>;
  }

  const expired =
    est.status === "EXPIRED" ||
    (est.expiresAt ? est.expiresAt < new Date() : false);
  const decided =
    est.status === "APPROVED" ||
    est.status === "REJECTED" ||
    est.status === "CONVERTED";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.estimate.title} #{est.number}
        </h1>
        <p className="text-sm text-foreground/60">
          {est.tenant.name} · {est.customer.name}
        </p>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-foreground/60">
            <tr>
              <th className="px-2 py-1 font-medium">{t.description}</th>
              <th className="px-2 py-1 text-right font-medium">{t.qty}</th>
              <th className="px-2 py-1 text-right font-medium">{t.unit}</th>
              <th className="px-2 py-1 text-right font-medium">{t.total}</th>
            </tr>
          </thead>
          <tbody>
            {est.lineItems.map((li) => (
              <tr
                key={li.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <td className="px-2 py-1">
                  <span className="text-foreground/50">
                    {lineItemTypeTh[li.type]}
                  </span>{" "}
                  {li.description}
                </td>
                <td className="px-2 py-1 text-right">{Number(li.quantity)}</td>
                <td className="px-2 py-1 text-right">
                  {formatMoney(li.unitPriceCents)}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatMoney(
                    Math.round(Number(li.quantity) * li.unitPriceCents),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-black/10 dark:border-white/10">
            <tr className="font-semibold">
              <td colSpan={3} className="px-2 py-1 text-right">
                {t.estimate.total}
              </td>
              <td className="px-2 py-1 text-right">
                {formatMoney(est.totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {decided ? (
        <p className="rounded-lg bg-green-500/10 p-4 text-center text-sm text-green-700 dark:text-green-300">
          {est.status === "REJECTED"
            ? t.estimate.portalRejected
            : t.estimate.portalApproved}
        </p>
      ) : expired ? (
        <p className="rounded-lg bg-amber-500/10 p-4 text-center text-sm text-amber-700 dark:text-amber-300">
          {t.estimate.portalExpired}
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-foreground/70">
            {t.estimate.portalReview}
          </p>
          <div className="flex justify-center gap-3">
            <form action={portalDecisionAction}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="decision" value="approve" />
              <button className="rounded-md bg-green-600 px-6 py-3 text-base font-medium text-white hover:opacity-90">
                {t.estimate.approve}
              </button>
            </form>
            <form action={portalDecisionAction}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="decision" value="reject" />
              <button className="rounded-md border border-red-500/40 px-6 py-3 text-base font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400">
                {t.estimate.reject}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
