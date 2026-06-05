import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import {
  getInvoice,
  NotFoundError,
} from "@/server/modules/invoice/invoice.service";
import {
  sendInvoiceAction,
  voidInvoiceAction,
} from "@/server/modules/invoice/actions";
import { formatMoney } from "@/server/lib/money";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { InvoiceBadge } from "@/components/ui/status-badge";
import { t, lineItemTypeTh, paymentMethodTh } from "@/i18n";
import { PaymentForm } from "./payment-form";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("invoice", "read");
  const { id } = await params;

  const invoice = await getInvoice(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  const balance = invoice.totalCents - invoice.amountPaidCents;
  const canUpdate = can(ctx.role, "invoice", "update");
  const canPay = can(ctx.role, "payment", "create");
  const isOpen = invoice.status !== "PAID" && invoice.status !== "VOID";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t.invoice.title} #${invoice.number}`}
        subtitle={invoice.customer.name}
        action={
          <div className="flex items-center gap-2">
            <InvoiceBadge status={invoice.status} />
            {canUpdate && invoice.status === "DRAFT" && (
              <form action={sendInvoiceAction}>
                <input type="hidden" name="id" value={id} />
                <button className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
                  {t.invoice.markSent}
                </button>
              </form>
            )}
            {canUpdate && isOpen && (
              <form action={voidInvoiceAction}>
                <input type="hidden" name="id" value={id} />
                <button className="rounded-md border border-red-500/30 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400">
                  {t.invoice.void}
                </button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <table className="w-full text-sm">
              <thead className="text-left text-foreground/60">
                <tr>
                  <th className="px-2 py-1 font-medium">{t.type}</th>
                  <th className="px-2 py-1 font-medium">{t.description}</th>
                  <th className="px-2 py-1 text-right font-medium">{t.qty}</th>
                  <th className="px-2 py-1 text-right font-medium">{t.unit}</th>
                  <th className="px-2 py-1 text-right font-medium">{t.total}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((li) => (
                  <tr
                    key={li.id}
                    className="border-t border-black/5 dark:border-white/5"
                  >
                    <td className="px-2 py-1 text-foreground/60">
                      {lineItemTypeTh[li.type]}
                    </td>
                    <td className="px-2 py-1">{li.description}</td>
                    <td className="px-2 py-1 text-right">
                      {Number(li.quantity)}
                    </td>
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
                <tr>
                  <td colSpan={4} className="px-2 py-1 text-right text-foreground/60">
                    {t.subtotal}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {formatMoney(invoice.subtotalCents)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-2 py-1 text-right text-foreground/60">
                    {t.tax}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {formatMoney(invoice.taxCents)}
                  </td>
                </tr>
                <tr className="font-semibold">
                  <td colSpan={4} className="px-2 py-1 text-right">
                    {t.invoice.total}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {formatMoney(invoice.totalCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>

          <Card title={t.invoice.payments}>
            {invoice.payments.length === 0 ? (
              <EmptyState>{t.invoice.noPayments}</EmptyState>
            ) : (
              <ul className="divide-y divide-black/5 text-sm dark:divide-white/5">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex justify-between py-2">
                    <span>
                      {paymentMethodTh[p.method]} ·{" "}
                      <span className="text-foreground/50">
                        {p.paidAt.toLocaleDateString("th-TH")}
                      </span>
                    </span>
                    <span>{formatMoney(p.amountCents)}</span>
                  </li>
                ))}
              </ul>
            )}
            {canPay && isOpen && (
              <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
                <PaymentForm invoiceId={id} balanceCents={balance} />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t.details}>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground/60">{t.invoice.amountPaid}</dt>
                <dd>{formatMoney(invoice.amountPaidCents)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt className="text-foreground/60">{t.invoice.balanceDue}</dt>
                <dd>{formatMoney(balance)}</dd>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <dt className="text-foreground/60">{t.invoice.dueDate}</dt>
                  <dd>{invoice.dueDate.toLocaleDateString("th-TH")}</dd>
                </div>
              )}
              {invoice.workOrder && (
                <div className="flex justify-between">
                  <dt className="text-foreground/60">{t.invoice.fromJob}</dt>
                  <dd>
                    <Link
                      href={`/jobs/${invoice.workOrder.id}`}
                      className="hover:underline"
                    >
                      #{invoice.workOrder.number}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>

      <Link
        href="/invoices"
        className="inline-block text-sm text-foreground/60 hover:underline"
      >
        {t.invoice.backToInvoices}
      </Link>
    </div>
  );
}
