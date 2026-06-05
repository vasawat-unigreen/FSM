"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateJobAction, type FormState } from "@/server/modules/workorder/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { t, jobTypeTh, jobPriorityTh } from "@/i18n";
import type { JobType, JobPriority } from "@/generated/prisma/client";

const select =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

export function JobEditForm({
  defaults,
  sites,
}: {
  defaults: {
    id: string;
    type: string;
    priority: string;
    summary: string;
    description: string;
    siteId: string;
    scheduledStart: string;
    scheduledEnd: string;
  };
  sites: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateJobAction,
    {},
  );
  const router = useRouter();

  return (
    <form action={action} className="max-w-lg space-y-4">
      <FormError message={state.error} />
      <input type="hidden" name="id" value={defaults.id} />

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t.type}</span>
          <select name="type" className={select} defaultValue={defaults.type}>
            {(["INSTALL", "REPAIR", "MAINTENANCE", "INSPECTION", "EMERGENCY"] as JobType[]).map(
              (v) => (
                <option key={v} value={v}>
                  {jobTypeTh[v]}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t.priority}</span>
          <select
            name="priority"
            className={select}
            defaultValue={defaults.priority}
          >
            {(["LOW", "NORMAL", "HIGH", "URGENT"] as JobPriority[]).map((v) => (
              <option key={v} value={v}>
                {jobPriorityTh[v]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Field label={t.summary} name="summary" defaultValue={defaults.summary} required />

      <label className="block space-y-1">
        <span className="text-sm font-medium">{t.description}</span>
        <textarea
          name="description"
          rows={3}
          className={select}
          defaultValue={defaults.description}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">{t.site}</span>
        <select name="siteId" className={select} defaultValue={defaults.siteId}>
          <option value="">{t.noSite}</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t.scheduledStart}</span>
          <input
            type="datetime-local"
            name="scheduledStart"
            className={select}
            defaultValue={defaults.scheduledStart}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t.scheduledEnd}</span>
          <input
            type="datetime-local"
            name="scheduledEnd"
            className={select}
            defaultValue={defaults.scheduledEnd}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <SubmitButton pending={pending}>{t.saveChanges}</SubmitButton>
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
