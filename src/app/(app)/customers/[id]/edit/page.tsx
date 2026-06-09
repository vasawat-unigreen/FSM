import { notFound } from "next/navigation";
import { requirePermission } from "@/server/lib/auth";
import { getCustomer, NotFoundError } from "@/server/modules/customer/customer.service";
import { updateCustomerAction } from "@/server/modules/customer/actions";
import { PageHeader } from "@/components/ui/primitives";
import { t } from "@/i18n";
import { CustomerForm } from "../../customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("customer", "update");
  const { id } = await params;

  const customer = await getCustomer(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`${t.edit} ${customer.name}`} />
      <CustomerForm
        action={updateCustomerAction}
        submitLabel={t.saveChanges}
        defaults={{
          id: customer.id,
          name: customer.name,
          type: customer.type,
          taxId: customer.taxId ?? "",
          billingAddress: customer.billingAddress ?? "",
          paymentTerms: customer.paymentTerms,
        }}
      />
    </div>
  );
}
