"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  recordPaymentAction,
  type FormState,
} from "@/server/modules/invoice/actions";
import { FormError } from "@/components/ui/form";
import { t, paymentMethodTh } from "@/i18n";
import type { PaymentMethod } from "@/generated/prisma/client";

const input =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

export function PaymentForm({
  invoiceId,
  balanceCents,
}: {
  invoiceId: string;
  balanceCents: number;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    recordPaymentAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="flex flex-wrap items-end gap-2">
        <input
          className={`${input} w-32`}
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(balanceCents / 100).toFixed(2)}
          placeholder={`${t.invoice.amount} ฿`}
          required
        />
        <select name="method" className={input} defaultValue="CASH">
          {(["CASH", "CARD", "CHECK", "ACH", "OTHER"] as PaymentMethod[]).map(
            (m) => (
              <option key={m} value={m}>
                {paymentMethodTh[m]}
              </option>
            ),
          )}
        </select>
        <button
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          disabled={pending}
        >
          {t.invoice.recordPayment}
        </button>
      </div>
    </form>
  );
}
