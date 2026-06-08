import { requirePermission } from "@/server/lib/auth";
import { listCustomers } from "@/server/modules/customer/customer.service";
import { createEstimateAction } from "@/server/modules/estimate/actions";
import { PageHeader, EmptyState, ButtonLink } from "@/components/ui/primitives";
import { t } from "@/i18n";

export default async function NewEstimatePage() {
  const ctx = await requirePermission("estimate", "create");
  const customers = await listCustomers(ctx);

  return (
    <div className="space-y-6">
      <PageHeader title={t.estimate.create} />
      {customers.length === 0 ? (
        <div className="space-y-3">
          <EmptyState>{t.estimate.needCustomerFirst}</EmptyState>
          <ButtonLink href="/customers/new">{t.newCustomer}</ButtonLink>
        </div>
      ) : (
        <form action={createEstimateAction} className="max-w-md space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">{t.estimate.customer}</span>
            <select
              name="customerId"
              required
              defaultValue=""
              className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20"
            >
              <option value="" disabled>
                {t.estimate.selectCustomer}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
            {t.estimate.create}
          </button>
        </form>
      )}
    </div>
  );
}
