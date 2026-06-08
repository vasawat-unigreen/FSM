import { notFound } from "next/navigation";
import { requirePermission } from "@/server/lib/auth";
import { getPart, NotFoundError } from "@/server/modules/inventory/inventory.service";
import { updatePartAction } from "@/server/modules/inventory/actions";
import { PageHeader } from "@/components/ui/primitives";
import { t } from "@/i18n";
import { PartForm } from "../part-form";

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("inventory", "update");
  const { id } = await params;
  const part = await getPart(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`${t.edit} ${part.name}`} subtitle={part.sku} />
      <PartForm
        action={updatePartAction}
        submitLabel={t.saveChanges}
        editMode
        defaults={{
          id: part.id,
          name: part.name,
          cost: (part.costCents / 100).toString(),
          price: (part.priceCents / 100).toString(),
          reorderPoint: Number(part.reorderPoint).toString(),
        }}
      />
    </div>
  );
}
