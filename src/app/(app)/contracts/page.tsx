import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { listContracts } from "@/server/modules/contract/contract.service";
import {
  toggleContractAction,
  generateDueAction,
} from "@/server/modules/contract/actions";
import { listCustomers } from "@/server/modules/customer/customer.service";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui/primitives";
import { t, contractFrequencyTh } from "@/i18n";
import { ContractForm } from "./contract-form";

export default async function ContractsPage() {
  const ctx = await requirePermission("job", "read");
  const [contracts, customers] = await Promise.all([
    listContracts(ctx),
    listCustomers(ctx),
  ]);
  const canManage = can(ctx.role, "job", "create");
  const today = new Date().toISOString().slice(0, 10);
  const dueCount = contracts.filter(
    (c) => c.active && c.nextRunAt && c.nextRunAt <= new Date(),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.contract.title}
        action={
          canManage && dueCount > 0 ? (
            <form action={generateDueAction}>
              <button className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
                {t.contract.generateDue} ({dueCount})
              </button>
            </form>
          ) : undefined
        }
      />

      {canManage && customers.length > 0 && (
        <Card title={t.contract.newContract}>
          <ContractForm
            today={today}
            customers={customers.map((c) => ({ id: c.id, name: c.name }))}
          />
        </Card>
      )}

      <Card>
        {contracts.length === 0 ? (
          <EmptyState>{t.contract.noContracts}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-2 font-medium">{t.contract.name}</th>
                <th className="px-2 py-2 font-medium">{t.contract.customer}</th>
                <th className="px-2 py-2 font-medium">{t.contract.frequency}</th>
                <th className="px-2 py-2 font-medium">{t.contract.nextRun}</th>
                <th className="px-2 py-2 font-medium">{t.status}</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const due =
                  c.active && c.nextRunAt && c.nextRunAt <= new Date();
                return (
                  <tr key={c.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-2 py-2">{c.name}</td>
                    <td className="px-2 py-2 text-foreground/70">{c.customer.name}</td>
                    <td className="px-2 py-2">{contractFrequencyTh[c.frequency]}</td>
                    <td className="px-2 py-2">
                      <span className={due ? "text-red-600 dark:text-red-400" : ""}>
                        {c.nextRunAt
                          ? c.nextRunAt.toLocaleDateString("th-TH")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <Badge>{c.active ? t.contract.active : t.contract.paused}</Badge>
                    </td>
                    {canManage && (
                      <td className="px-2 py-2 text-right">
                        <form action={toggleContractAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="text-xs text-foreground/60 underline hover:text-foreground">
                            {c.active ? t.contract.paused : t.contract.active}
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
