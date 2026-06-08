import { requirePermission } from "@/server/lib/auth";
import { createPartAction } from "@/server/modules/inventory/actions";
import { PageHeader } from "@/components/ui/primitives";
import { t } from "@/i18n";
import { PartForm } from "../part-form";

export default async function NewPartPage() {
  await requirePermission("inventory", "create");
  return (
    <div className="space-y-6">
      <PageHeader title={t.inventory.newPart} />
      <PartForm action={createPartAction} submitLabel={t.inventory.newPart} />
    </div>
  );
}
