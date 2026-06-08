"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  updateTaxAction,
  addMemberAction,
  type FormState,
} from "@/server/modules/settings/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { t, roleTh } from "@/i18n";
import type { UserRole } from "@/generated/prisma/client";

const ROLES: UserRole[] = [
  "OWNER",
  "ADMIN",
  "DISPATCHER",
  "TECHNICIAN",
  "ACCOUNTANT",
  "READ_ONLY",
];

const input =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

export function TaxForm({ taxPercent }: { taxPercent: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateTaxAction,
    {},
  );
  return (
    <form action={action} className="max-w-xs space-y-2">
      <FormError message={state.error} />
      {state.ok && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t.admin.saved}
        </p>
      )}
      <Field
        label={t.admin.taxRate}
        name="taxPercent"
        type="number"
        step="0.01"
        min="0"
        max="100"
        defaultValue={String(taxPercent)}
      />
      <p className="text-xs text-foreground/50">{t.admin.taxRateHint}</p>
      <SubmitButton pending={pending}>{t.save}</SubmitButton>
    </form>
  );
}

export function AddMemberForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addMemberAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      {state.ok && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t.admin.saved}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <input className={input} name="name" placeholder={t.name} required />
        <input className={input} name="email" type="email" placeholder={t.email} required />
        <input className={input} name="password" type="text" placeholder={t.admin.tempPassword} required />
        <select name="role" className={input} defaultValue="TECHNICIAN">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleTh[r]}
            </option>
          ))}
        </select>
        <button
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          disabled={pending}
        >
          {t.admin.addMember}
        </button>
      </div>
    </form>
  );
}
