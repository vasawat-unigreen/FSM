import { notFound } from "next/navigation";
import { requirePermission } from "@/server/lib/auth";
import {
  getWorkOrder,
  NotFoundError,
} from "@/server/modules/workorder/workorder.service";
import { getCustomer } from "@/server/modules/customer/customer.service";
import { PageHeader } from "@/components/ui/primitives";
import { t } from "@/i18n";
import { JobEditForm } from "./edit-form";

/** Date -> value for <input type="datetime-local"> (yyyy-MM-ddThh:mm). */
function toLocalInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16) : "";
}

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("job", "update");
  const { id } = await params;

  const job = await getWorkOrder(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });
  const customer = await getCustomer(ctx, job.customer.id).catch(() => null);
  const sites = (customer?.sites ?? []).map((s) => ({
    id: s.id,
    label: s.name ? `${s.name} — ${s.address}` : s.address,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={`${t.edit} #${job.number}`} />
      <JobEditForm
        sites={sites}
        defaults={{
          id: job.id,
          type: job.type,
          priority: job.priority,
          summary: job.summary,
          description: job.description ?? "",
          siteId: job.siteId ?? "",
          scheduledStart: toLocalInput(job.scheduledStart),
          scheduledEnd: toLocalInput(job.scheduledEnd),
        }}
      />
    </div>
  );
}
