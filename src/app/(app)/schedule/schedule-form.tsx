"use client";

import { useActionState } from "react";
import Link from "next/link";
import { scheduleJobAction, type FormState } from "@/server/modules/schedule/actions";
import { FormError } from "@/components/ui/form";
import { t } from "@/i18n";

const input =
  "rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

export function ScheduleJobForm({
  job,
  date,
  technicians,
}: {
  job: { id: string; number: number; summary: string; customerName: string };
  date: string;
  technicians: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    scheduleJobAction,
    {},
  );

  return (
    <form
      action={action}
      className="space-y-2 rounded-lg border border-black/10 p-3 dark:border-white/10"
    >
      <div className="text-sm">
        <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
          #{job.number} {job.summary}
        </Link>
        <div className="text-xs text-foreground/50">{job.customerName}</div>
      </div>
      <FormError message={state.error} />
      <input type="hidden" name="workOrderId" value={job.id} />
      <input type="hidden" name="date" value={date} />
      <div className="flex flex-wrap gap-2">
        <select name="technicianId" className={input} required defaultValue="">
          <option value="" disabled>
            {t.technician}
          </option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
        <input
          type="time"
          name="startTime"
          className={`${input} w-28`}
          defaultValue="09:00"
          required
        />
        <select name="durationMin" className={input} defaultValue="60">
          <option value="30">30 {t.minutes}</option>
          <option value="60">60 {t.minutes}</option>
          <option value="90">90 {t.minutes}</option>
          <option value="120">120 {t.minutes}</option>
        </select>
        <button
          className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          disabled={pending}
        >
          {t.scheduleJob}
        </button>
      </div>
    </form>
  );
}
