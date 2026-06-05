"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createJobAction, type FormState } from "@/server/modules/workorder/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { t, jobTypeTh, jobPriorityTh } from "@/i18n";
import type { JobType, JobPriority } from "@/generated/prisma/client";

const select =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

export function JobForm({
  customers,
  technicians,
}: {
  customers: { id: string; name: string }[];
  technicians: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createJobAction,
    {},
  );
  const router = useRouter();

  return (
    <form action={action} className="max-w-lg space-y-4">
      <FormError message={state.error} />

      <label className="block space-y-1">
        <span className="text-sm font-medium">{t.customer}</span>
        <select name="customerId" className={select} required defaultValue="">
          <option value="" disabled>
            {t.selectCustomer}
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">{t.type}</span>
          <select name="type" className={select} defaultValue="REPAIR">
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
          <select name="priority" className={select} defaultValue="NORMAL">
            {(["LOW", "NORMAL", "HIGH", "URGENT"] as JobPriority[]).map((v) => (
              <option key={v} value={v}>
                {jobPriorityTh[v]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Field label={t.summary} name="summary" required />

      <label className="block space-y-1">
        <span className="text-sm font-medium">{t.description}</span>
        <textarea
          name="description"
          rows={3}
          className={select}
          placeholder={t.description2}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">
          {t.assignTechnician} {t.optional}
        </span>
        <select name="assignedTechId" className={select} defaultValue="">
          <option value="">{t.unassigned}</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <SubmitButton pending={pending}>{t.createJob}</SubmitButton>
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
