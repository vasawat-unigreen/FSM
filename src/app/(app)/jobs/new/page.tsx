import { requirePermission } from "@/server/lib/auth";
import { listCustomers } from "@/server/modules/customer/customer.service";
import { listTechnicians } from "@/server/modules/workorder/workorder.service";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/primitives";
import { t } from "@/i18n";
import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const ctx = await requirePermission("job", "create");
  const [customers, technicians] = await Promise.all([
    listCustomers(ctx),
    listTechnicians(ctx),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t.newJob} />
      {customers.length === 0 ? (
        <div className="space-y-3">
          <EmptyState>{t.needCustomerFirst}</EmptyState>
          <ButtonLink href="/customers/new">{t.createCustomerFirst}</ButtonLink>
        </div>
      ) : (
        <JobForm
          customers={customers.map((c) => ({ id: c.id, name: c.name }))}
          technicians={technicians.map((t) => ({
            id: t.id,
            name: t.user.name,
          }))}
        />
      )}
    </div>
  );
}
