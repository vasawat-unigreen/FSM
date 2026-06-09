"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/server/modules/customer/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { t, customerTypeTh } from "@/i18n";
import type { CustomerType } from "@/generated/prisma/client";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const TYPES: CustomerType[] = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "SERVICE_STATION",
  "FUEL_DEPOT",
  "OTHER",
];

export interface CustomerDefaults {
  id?: string;
  name?: string;
  type?: CustomerType;
  taxId?: string;
  billingAddress?: string;
  paymentTerms?: string;
}

export function CustomerForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: Action;
  defaults?: CustomerDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <FormError message={state.error} />
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <Field label={t.name} name="name" defaultValue={defaults.name} required />

      <label className="block space-y-1">
        <span className="text-sm font-medium">{t.type}</span>
        <select
          name="type"
          defaultValue={defaults.type ?? "RESIDENTIAL"}
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20"
        >
          {TYPES.map((v) => (
            <option key={v} value={v}>
              {customerTypeTh[v]}
            </option>
          ))}
        </select>
      </label>

      <Field label={t.taxId} name="taxId" defaultValue={defaults.taxId} />

      <Field
        label={t.billingAddress}
        name="billingAddress"
        defaultValue={defaults.billingAddress}
      />
      <Field
        label={t.paymentTerms}
        name="paymentTerms"
        defaultValue={defaults.paymentTerms ?? "net_30"}
      />

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
