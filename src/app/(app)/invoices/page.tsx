import Link from "next/link";
import { requirePermission } from "@/server/lib/auth";
import {
  listInvoices,
  outstandingCents,
} from "@/server/modules/invoice/invoice.service";
import type { InvoiceStatus } from "@/generated/prisma/client";
import { formatMoney } from "@/server/lib/money";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { InvoiceBadge } from "@/components/ui/status-badge";
import { t, invoiceStatusTh } from "@/i18n";

const STATUSES: InvoiceStatus[] = [
  "DRAFT",
  "SENT",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "VOID",
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requirePermission("invoice", "read");
  const { status } = await searchParams;
  const active = STATUSES.includes(status as InvoiceStatus)
    ? (status as InvoiceStatus)
    : undefined;

  const [invoices, outstanding] = await Promise.all([
    listInvoices(ctx, { status: active }),
    outstandingCents(ctx),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.invoice.title}
        subtitle={`${t.invoice.outstanding}: ${formatMoney(outstanding)}`}
      />

      <div className="flex flex-wrap gap-1 text-sm">
        <Link
          href="/invoices"
          className={`rounded-md px-2 py-1 ${!active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
        >
          {t.all}
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/invoices?status=${s}`}
            className={`rounded-md px-2 py-1 ${active === s ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
          >
            {invoiceStatusTh[s]}
          </Link>
        ))}
      </div>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState>{t.invoice.noInvoices}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-2 font-medium">{t.invoice.number}</th>
                <th className="px-2 py-2 font-medium">{t.invoice.customer}</th>
                <th className="px-2 py-2 text-right font-medium">
                  {t.invoice.total}
                </th>
                <th className="px-2 py-2 text-right font-medium">
                  {t.invoice.balanceDue}
                </th>
                <th className="px-2 py-2 font-medium">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-2 py-2">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-medium hover:underline"
                    >
                      #{inv.number}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-foreground/70">
                    {inv.customer.name}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {formatMoney(inv.totalCents)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {formatMoney(inv.totalCents - inv.amountPaidCents)}
                  </td>
                  <td className="px-2 py-2">
                    <InvoiceBadge status={inv.status} />
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
