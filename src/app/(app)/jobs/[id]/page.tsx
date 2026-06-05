import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import {
  getWorkOrder,
  workOrderTotals,
  listTechnicians,
  NotFoundError,
} from "@/server/modules/workorder/workorder.service";
import {
  changeStatusAction,
  assignTechAction,
  deleteLineItemAction,
  deleteJobAction,
} from "@/server/modules/workorder/actions";
import { getCustomer } from "@/server/modules/customer/customer.service";
import { listActivity } from "@/server/lib/activity";
import { nextStates } from "@/server/lib/job-state-machine";
import { formatMoney } from "@/server/lib/money";
import { PageHeader, Card, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { StatusBadge, PriorityLabel } from "@/components/ui/status-badge";
import { t, jobStatusTh, jobTypeTh, lineItemTypeTh } from "@/i18n";
import { AddLineItemForm, AddNoteForm } from "./job-forms";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("job", "read");
  const { id } = await params;

  const job = await getWorkOrder(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  const [totals, activity, technicians, customer] = await Promise.all([
    workOrderTotals(ctx, job.lineItems),
    listActivity(ctx, "work_order", id),
    listTechnicians(ctx),
    getCustomer(ctx, job.customer.id).catch(() => null),
  ]);

  const canUpdate = can(ctx.role, "job", "update");
  const canDelete = can(ctx.role, "job", "delete");
  const transitions = nextStates(job.status);
  const sites = customer?.sites ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`#${job.number} · ${job.summary}`}
        subtitle={`${job.customer.name}${job.site ? ` — ${job.site.address}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <PriorityLabel priority={job.priority} />
            <StatusBadge status={job.status} />
            {canUpdate && (
              <ButtonLink href={`/jobs/${id}/edit`} variant="ghost">
                {t.edit}
              </ButtonLink>
            )}
            {canDelete && (
              <form action={deleteJobAction}>
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

      {/* Status workflow */}
      {canUpdate && transitions.length > 0 && (
        <Card title={t.workflow}>
          <div className="flex flex-wrap gap-2">
            {transitions.map((to) => (
              <form key={to} action={changeStatusAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="to" value={to} />
                <button
                  type="submit"
                  className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  → {jobStatusTh[to]}
                </button>
              </form>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {job.description && (
            <Card title={t.description}>
              <p className="whitespace-pre-wrap text-sm text-foreground/80">
                {job.description}
              </p>
            </Card>
          )}

          {/* Line items + totals */}
          <Card title={t.lineItems}>
            {job.lineItems.length === 0 ? (
              <EmptyState>{t.noLineItems}</EmptyState>
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
                  {job.lineItems.map((li) => (
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
                      <td className="px-2 py-1 text-right">
                        {canUpdate && (
                          <form action={deleteLineItemAction}>
                            <input type="hidden" name="id" value={li.id} />
                            <input
                              type="hidden"
                              name="workOrderId"
                              value={id}
                            />
                            <button
                              type="submit"
                              className="text-foreground/40 hover:text-red-600"
                            >
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
                      {formatMoney(totals.subtotalCents)}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-2 py-1 text-right text-foreground/60">
                      {t.tax}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatMoney(totals.taxCents)}
                    </td>
                    <td />
                  </tr>
                  <tr className="font-semibold">
                    <td colSpan={4} className="px-2 py-1 text-right">
                      {t.total}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatMoney(totals.totalCents)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
            {canUpdate && (
              <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
                <AddLineItemForm workOrderId={id} />
              </div>
            )}
          </Card>

          {/* Notes / timeline */}
          <Card title={t.activityAndNotes}>
            {canUpdate && (
              <div className="mb-3">
                <AddNoteForm workOrderId={id} />
              </div>
            )}
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

        {/* Sidebar: assignment + site */}
        <div className="space-y-6">
          <Card title={t.assignTechnician}>
            {canUpdate ? (
              <form action={assignTechAction} className="space-y-2">
                <input type="hidden" name="id" value={id} />
                <select
                  name="assignedTechId"
                  defaultValue={job.assignedTechId ?? ""}
                  className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
                >
                  <option value="">{t.unassigned}</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.user.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  {t.updateAssignment}
                </button>
              </form>
            ) : (
              <p className="text-sm">
                {job.assignedTech?.user.name ?? t.unassigned}
              </p>
            )}
          </Card>

          <Card title={t.details}>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground/60">{t.type}</dt>
                <dd>{jobTypeTh[job.type]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/60">{t.site}</dt>
                <dd className="text-right">
                  {job.site ? job.site.address : "—"}
                </dd>
              </div>
              {sites.length > 0 && job.site === null && (
                <p className="pt-1 text-xs text-foreground/50">
                  {t.setSiteFromEdit}
                </p>
              )}
              <div className="flex justify-between">
                <dt className="text-foreground/60">{t.created}</dt>
                <dd>{job.createdAt.toLocaleDateString("th-TH")}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Link
        href="/jobs"
        className="inline-block text-sm text-foreground/60 hover:underline"
      >
        {t.backToJobs}
      </Link>
    </div>
  );
}
