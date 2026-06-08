"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/server/modules/inventory/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { t } from "@/i18n";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function PartForm({
  action,
  defaults = {},
  submitLabel,
  editMode = false,
}: {
  action: Action;
  defaults?: {
    id?: string;
    sku?: string;
    name?: string;
    cost?: string;
    price?: string;
    qtyOnHand?: string;
    reorderPoint?: string;
  };
  submitLabel: string;
  editMode?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <FormError message={state.error} />
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      {!editMode && (
        <Field label={t.inventory.sku} name="sku" defaultValue={defaults.sku} required />
      )}
      <Field label={t.inventory.name} name="name" defaultValue={defaults.name} required />
      <div className="grid grid-cols-2 gap-4">
        <Field label={`${t.inventory.cost} (฿)`} name="cost" type="number" step="0.01" defaultValue={defaults.cost ?? "0"} />
        <Field label={`${t.inventory.price} (฿)`} name="price" type="number" step="0.01" defaultValue={defaults.price ?? "0"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {!editMode && (
          <Field label={t.inventory.onHand} name="qtyOnHand" type="number" step="1" defaultValue={defaults.qtyOnHand ?? "0"} />
        )}
        <Field label={t.inventory.reorderPoint} name="reorderPoint" type="number" step="1" defaultValue={defaults.reorderPoint ?? "0"} />
      </div>
      <div className="flex gap-2">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
