import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import {
  getCustomer,
  NotFoundError,
} from "@/server/modules/customer/customer.service";
import {
  deleteCustomerAction,
  deleteContactAction,
} from "@/server/modules/customer/actions";
import { listActivity } from "@/server/lib/activity";
import {
  PageHeader,
  Card,
  ButtonLink,
  EmptyState,
  Badge,
} from "@/components/ui/primitives";
import { t, customerTypeTh } from "@/i18n";
import { AddContactForm, AddSiteForm, AddAssetForm } from "./add-forms";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("customer", "read");
  const { id } = await params;

  const customer = await getCustomer(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  const activity = await listActivity(ctx, "customer", id);
  const canUpdate = can(ctx.role, "customer", "update");
  const canDelete = can(ctx.role, "customer", "delete");

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        subtitle={customer.billingAddress ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge>{customerTypeTh[customer.type]}</Badge>
            {canUpdate && (
              <ButtonLink href={`/customers/${id}/edit`} variant="ghost">
                {t.edit}
              </ButtonLink>
            )}
            {canDelete && (
              <form action={deleteCustomerAction}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  className="rounded-md border border-red-500/30 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
                >
                  {t.delete}
                </button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contacts */}
          <Card title={t.contacts}>
            {customer.contacts.length === 0 ? (
              <EmptyState>{t.noContacts}</EmptyState>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {customer.contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{c.name}</span>
                      {c.isPrimary && <span className="ml-2"><Badge>{t.primary}</Badge></span>}
                      <div className="text-foreground/60">
                        {[c.role, c.email, c.phone].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {canUpdate && (
                      <form action={deleteContactAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="customerId" value={id} />
                        <button
                          type="submit"
                          className="text-foreground/40 hover:text-red-600"
                        >
                          {t.remove}
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canUpdate && (
              <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
                <AddContactForm customerId={id} />
              </div>
            )}
          </Card>

          {/* Sites & assets */}
          <Card title={t.sitesAndAssets}>
            {customer.sites.length === 0 ? (
              <EmptyState>{t.noSites}</EmptyState>
            ) : (
              <ul className="space-y-4">
                {customer.sites.map((site) => (
                  <li
                    key={site.id}
                    className="rounded-lg border border-black/10 p-3 dark:border-white/10"
                  >
                    <div className="text-sm font-medium">
                      {site.name ? `${site.name} — ` : ""}
                      {site.address}
                    </div>
                    {(site.gateCode || site.accessNotes) && (
                      <div className="text-xs text-foreground/50">
                        {[site.gateCode && `Gate ${site.gateCode}`, site.accessNotes]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                    <div className="mt-2 space-y-1">
                      {site.assets.length === 0 ? (
                        <p className="text-xs text-foreground/40">{t.noAssets}</p>
                      ) : (
                        site.assets.map((a) => (
                          <div key={a.id} className="text-xs text-foreground/70">
                            • {a.name}
                            {[a.make, a.model, a.serial].filter(Boolean).length
                              ? ` (${[a.make, a.model, a.serial]
                                  .filter(Boolean)
                                  .join(" / ")})`
                              : ""}
                          </div>
                        ))
                      )}
                    </div>
                    {canUpdate && (
                      <div className="mt-2 border-t border-black/5 pt-2 dark:border-white/5">
                        <AddAssetForm siteId={site.id} customerId={id} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canUpdate && (
              <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
                <AddSiteForm customerId={id} />
              </div>
            )}
          </Card>
        </div>

        {/* History timeline */}
        <Card title={t.history}>
          {activity.length === 0 ? (
            <EmptyState>{t.noActivity}</EmptyState>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <div>{a.body}</div>
                  <div className="text-xs text-foreground/50">
                    {a.author?.name ?? "ระบบ"} ·{" "}
                    {a.createdAt.toLocaleString("th-TH")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Link
        href="/customers"
        className="inline-block text-sm text-foreground/60 hover:underline"
      >
        {t.backToCustomers}
      </Link>
    </div>
  );
}
