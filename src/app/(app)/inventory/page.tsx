import Link from "next/link";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { listParts } from "@/server/modules/inventory/inventory.service";
import { adjustStockAction } from "@/server/modules/inventory/actions";
import { formatMoney } from "@/server/lib/money";
import { PageHeader, Card, ButtonLink, EmptyState, Badge } from "@/components/ui/primitives";
import { t } from "@/i18n";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ low?: string }>;
}) {
  const ctx = await requirePermission("inventory", "read");
  const { low } = await searchParams;
  const lowOnly = low === "1";
  const parts = await listParts(ctx, { lowStockOnly: lowOnly });
  const canEdit = can(ctx.role, "inventory", "update");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.inventory.title}
        subtitle={`${parts.length} ${t.shown}`}
        action={
          can(ctx.role, "inventory", "create") ? (
            <ButtonLink href="/inventory/new">{t.inventory.newPart}</ButtonLink>
          ) : undefined
        }
      />

      <div className="flex gap-1 text-sm">
        <Link
          href="/inventory"
          className={`rounded-md px-2 py-1 ${!lowOnly ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
        >
          {t.all}
        </Link>
        <Link
          href="/inventory?low=1"
          className={`rounded-md px-2 py-1 ${lowOnly ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
        >
          {t.inventory.lowStockOnly}
        </Link>
      </div>

      <Card>
        {parts.length === 0 ? (
          <EmptyState>{t.inventory.noParts}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-2 font-medium">{t.inventory.sku}</th>
                <th className="px-2 py-2 font-medium">{t.inventory.name}</th>
                <th className="px-2 py-2 text-right font-medium">{t.inventory.price}</th>
                <th className="px-2 py-2 text-right font-medium">{t.inventory.onHand}</th>
                {canEdit && <th className="px-2 py-2 font-medium">{t.inventory.adjustStock}</th>}
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-2 py-2 font-mono text-xs text-foreground/70">
                    {p.sku}
                  </td>
                  <td className="px-2 py-2">
                    {canEdit ? (
                      <Link href={`/inventory/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    ) : (
                      p.name
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">{formatMoney(p.priceCents)}</td>
                  <td className="px-2 py-2 text-right">
                    <span className={p.low ? "text-red-600 dark:text-red-400" : ""}>
                      {Number(p.qtyOnHand)}
                    </span>
                    {p.low && <span className="ml-2"><Badge>{t.inventory.lowStock}</Badge></span>}
                  </td>
                  {canEdit && (
                    <td className="px-2 py-2">
                      <form action={adjustStockAction} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          name="delta"
                          type="number"
                          step="1"
                          placeholder="±"
                          title={t.inventory.adjustHint}
                          className="w-16 rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
                          required
                        />
                        <button className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
                          OK
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
