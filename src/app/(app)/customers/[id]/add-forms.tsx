"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  addContactAction,
  addSiteAction,
  addAssetAction,
  type FormState,
} from "@/server/modules/customer/actions";
import { FormError } from "@/components/ui/form";
import { t } from "@/i18n";

const input =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";
const btn =
  "rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50";

/** Reset the form's inputs once an add succeeds. */
function useResetOnOk(ok: boolean | undefined, ref: React.RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    if (ok) ref.current?.reset();
  }, [ok, ref]);
}

export function AddContactForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addContactAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useResetOnOk(state.ok, ref);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="customerId" value={customerId} />
      <div className="flex flex-wrap gap-2">
        <input className={input} name="name" placeholder={t.name} required />
        <input className={input} name="email" placeholder={t.email} />
        <input className={input} name="phone" placeholder={t.phone} />
        <input className={input} name="role" placeholder={t.role} />
        <label className="flex items-center gap-1 text-sm text-foreground/70">
          <input type="checkbox" name="isPrimary" value="true" /> {t.primary}
        </label>
        <button className={btn} disabled={pending}>
          {t.add}
        </button>
      </div>
    </form>
  );
}

export function AddSiteForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addSiteAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useResetOnOk(state.ok, ref);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="customerId" value={customerId} />
      <div className="flex flex-wrap gap-2">
        <input className={input} name="name" placeholder={`${t.label} ${t.optional}`} />
        <input className={input} name="address" placeholder={t.address} required />
        <input className={input} name="gateCode" placeholder={t.gateCode} />
        <input className={input} name="accessNotes" placeholder={t.accessNotes} />
        <button className={btn} disabled={pending}>
          {t.addSite}
        </button>
      </div>
    </form>
  );
}

export function AddAssetForm({
  siteId,
  customerId,
}: {
  siteId: string;
  customerId: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addAssetAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useResetOnOk(state.ok, ref);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="customerId" value={customerId} />
      <div className="flex flex-wrap gap-2">
        <input className={input} name="name" placeholder={t.equipmentName} required />
        <input className={input} name="make" placeholder={t.make} />
        <input className={input} name="model" placeholder={t.model} />
        <input className={input} name="serial" placeholder={t.serial} />
        <button className={btn} disabled={pending}>
          {t.addAsset}
        </button>
      </div>
    </form>
  );
}
