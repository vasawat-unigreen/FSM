"use client";

import { useActionState } from "react";
import {
  createContractAction,
  type FormState,
} from "@/server/modules/contract/actions";
import { FormError } from "@/components/ui/form";
import { t, contractFrequencyTh } from "@/i18n";
import type { ContractFrequency } from "@/generated/prisma/client";

const input =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

const FREQS: ContractFrequency[] = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "ANNUAL",
];

export function ContractForm({
  customers,
  today,
}: {
  customers: { id: string; name: string }[];
  today: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createContractAction,
    {},
  );

  return (
    <form action={action} className="space-y-2">
      <FormError message={state.error} />
      <div className="flex flex-wrap items-end gap-2">
        <select name="customerId" className={input} required defaultValue="">
          <option value="" disabled>
            {t.contract.selectCustomer}
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className={`${input} flex-1`}
          name="name"
          placeholder={t.contract.name}
          required
        />
        <select name="frequency" className={input} defaultValue="MONTHLY">
          {FREQS.map((f) => (
            <option key={f} value={f}>
              {contractFrequencyTh[f]}
            </option>
          ))}
        </select>
        <input className={input} name="nextRunAt" type="date" defaultValue={today} required />
        <button
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          disabled={pending}
        >
          {t.contract.create}
        </button>
      </div>
    </form>
  );
}
