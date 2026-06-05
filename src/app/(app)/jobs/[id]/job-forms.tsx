"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  addLineItemAction,
  addNoteAction,
  type FormState,
} from "@/server/modules/workorder/actions";
import { FormError } from "@/components/ui/form";
import { t, lineItemTypeTh } from "@/i18n";
import type { LineItemType } from "@/generated/prisma/client";

const input =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";
const btn =
  "rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50";

function useResetOnOk(
  ok: boolean | undefined,
  ref: React.RefObject<HTMLFormElement | null>,
) {
  useEffect(() => {
    if (ok) ref.current?.reset();
  }, [ok, ref]);
}

export function AddLineItemForm({ workOrderId }: { workOrderId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addLineItemAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useResetOnOk(state.ok, ref);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="workOrderId" value={workOrderId} />
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
        <button className={btn} disabled={pending}>
          {t.add}
        </button>
      </div>
    </form>
  );
}

export function AddNoteForm({ workOrderId }: { workOrderId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addNoteAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useResetOnOk(state.ok, ref);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <div className="flex gap-2">
        <input
          className={`${input} flex-1`}
          name="body"
          placeholder={t.addNote}
          required
        />
        <button className={btn} disabled={pending}>
          {t.post}
        </button>
      </div>
    </form>
  );
}
