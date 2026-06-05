"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { moveAppointmentAction } from "@/server/modules/schedule/actions";
import { t } from "@/i18n";

export interface ApptVM {
  id: string;
  technicianId: string;
  startLabel: string;
  endLabel: string;
  jobId: string;
  jobNumber: number;
  summary: string;
  customerName: string;
  statusTh: string;
}

export interface TechVM {
  id: string;
  name: string;
  color: string;
}

export function DispatchBoard({
  technicians,
  appointments,
  canEdit,
}: {
  technicians: TechVM[];
  appointments: ApptVM[];
  canEdit: boolean;
}) {
  // Local copy so drops feel instant; re-sync (during render, the React-
  // recommended way) whenever the server sends new appointment data.
  const [appts, setAppts] = useState(appointments);
  const [syncedFrom, setSyncedFrom] = useState(appointments);
  const [pending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);

  if (syncedFrom !== appointments) {
    setSyncedFrom(appointments);
    setAppts(appointments);
  }

  function onDrop(techId: string) {
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const appt = appts.find((a) => a.id === id);
    if (!appt || appt.technicianId === techId) return;

    // Optimistic move; the server confirms or a revalidate corrects it.
    setAppts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, technicianId: techId } : a)),
    );
    const fd = new FormData();
    fd.set("id", id);
    fd.set("technicianId", techId);
    startTransition(() => moveAppointmentAction(fd));
  }

  return (
    <div className={pending ? "opacity-70 transition-opacity" : ""}>
      {canEdit && (
        <p className="mb-2 text-xs text-foreground/50">{t.dragHint}</p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {technicians.map((tech) => {
          const col = appts.filter((a) => a.technicianId === tech.id);
          return (
            <div
              key={tech.id}
              onDragOver={(e) => canEdit && e.preventDefault()}
              onDrop={() => canEdit && onDrop(tech.id)}
              className="flex w-64 shrink-0 flex-col rounded-xl border border-black/10 dark:border-white/10"
            >
              <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2 dark:border-white/5">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: tech.color }}
                />
                <span className="text-sm font-medium">{tech.name}</span>
                <span className="ml-auto text-xs text-foreground/40">
                  {col.length}
                </span>
              </div>
              <div className="flex min-h-40 flex-col gap-2 p-2">
                {col.length === 0 ? (
                  <p className="py-6 text-center text-xs text-foreground/30">
                    {t.noAppointments}
                  </p>
                ) : (
                  col.map((a) => (
                    <div
                      key={a.id}
                      draggable={canEdit}
                      onDragStart={() => setDragId(a.id)}
                      className={`rounded-lg border border-black/10 bg-black/[.02] p-2 text-sm dark:border-white/10 dark:bg-white/[.03] ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      <div className="font-medium">
                        {a.startLabel}–{a.endLabel}
                      </div>
                      <Link
                        href={`/jobs/${a.jobId}`}
                        className="text-foreground/80 hover:underline"
                      >
                        #{a.jobNumber} {a.summary}
                      </Link>
                      <div className="text-xs text-foreground/50">
                        {a.customerName} · {a.statusTh}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
        {technicians.length === 0 && (
          <p className="text-sm text-foreground/50">
            ยังไม่มีช่างในระบบ
          </p>
        )}
      </div>
    </div>
  );
}
