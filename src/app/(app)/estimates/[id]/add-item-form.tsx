"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  addEstimateItemAction,
  type FormState,
} from "@/server/modules/estimate/actions";
import { FormError } from "@/components/ui/form";
import { t, lineItemTypeTh } from "@/i18n";
import type { LineItemType } from "@/generated/prisma/client";

const input =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

export function AddItemForm({ estimateId }: { estimateId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addEstimateItemAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="estimateId" value={estimateId} />
      <div className="flex flex-wrap items-end gap-2">
        <select name="type" className={input} defaultValue="LABOR">
          {(["LABOR", "PART", "FEE", "DISCOUNT"] as LineItemType[]).map((v) => (
            <option key={v} value={v}>
              {lineItemTypeTh[v]}
            </option>
          ))}
        </select>
        <input
          className={`${input} flex-1`}
          name="description"
          placeholder={t.description}
          required
        />
        <input
          className={`${input} w-20`}
          name="quantity"
          type="number"
          step="0.25"
          min="0"
          defaultValue="1"
          placeholder={t.qty}
        />
        <input
          className={`${input} w-28`}
          name="unitPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder={`${t.unit} ฿`}
        />
        <button
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          disabled={pending}
        >
          {t.add}
        </button>
      </div>
    </form>
  );
}
