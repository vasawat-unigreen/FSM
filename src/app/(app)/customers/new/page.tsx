import { requirePermission } from "@/server/lib/auth";
import { createCustomerAction } from "@/server/modules/customer/actions";
import { PageHeader } from "@/components/ui/primitives";
import { t } from "@/i18n";
import { CustomerForm } from "../customer-form";

export default async function NewCustomerPage() {
  await requirePermission("customer", "create");
  return (
    <div className="space-y-6">
      <PageHeader title={t.newCustomer} />
      <CustomerForm action={createCustomerAction} submitLabel={t.newCustomer} />
    </div>
  );
}
