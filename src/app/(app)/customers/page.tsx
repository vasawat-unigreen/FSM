import Link from "next/link";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { listCustomers } from "@/server/modules/customer/customer.service";
import {
  PageHeader,
  ButtonLink,
  Card,
  EmptyState,
  Badge,
} from "@/components/ui/primitives";
import { t, customerTypeTh } from "@/i18n";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requirePermission("customer", "read");
  const { q } = await searchParams;
  const customers = await listCustomers(ctx, q?.trim() || undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.customers}
        subtitle={`${customers.length} ${t.shown}`}
        action={
          can(ctx.role, "customer", "create") ? (
            <ButtonLink href="/customers/new">{t.newCustomer}</ButtonLink>
          ) : undefined
        }
      />

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={t.searchByName}
          className="w-full max-w-xs rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20"
        />
        <button
          type="submit"
          className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {t.search}
        </button>
      </form>

      <Card>
        {customers.length === 0 ? (
          <EmptyState>{t.noCustomers}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-2 font-medium">{t.name}</th>
                <th className="px-2 py-2 font-medium">{t.type}</th>
                <th className="px-2 py-2 font-medium">{t.sites}</th>
                <th className="px-2 py-2 font-medium">{t.jobsCount}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-2 py-2">
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-2 py-2">
                    <Badge>{customerTypeTh[c.type]}</Badge>
                  </td>
                  <td className="px-2 py-2 text-foreground/70">
                    {c._count.sites}
                  </td>
                  <td className="px-2 py-2 text-foreground/70">
                    {c._count.workOrders}
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
