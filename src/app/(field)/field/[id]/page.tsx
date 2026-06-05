import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/lib/auth";
import {
  getMyJob,
  listAttachments,
  NotFoundError,
} from "@/server/modules/field/field.service";
import {
  fieldStatusAction,
  startTimerAction,
  stopTimerAction,
} from "@/server/modules/field/actions";
import { nextStates } from "@/server/lib/job-state-machine";
import { formatMoney } from "@/server/lib/money";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/primitives";
import { t, jobStatusTh } from "@/i18n";
import { AddPartForm, PhotoUpload, SignaturePad } from "./field-forms";

function timeLabel(d: Date): string {
  return d.toISOString().slice(11, 16);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/50">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("job", "read");
  const { id } = await params;

  const job = await getMyJob(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });
  const attachments = await listAttachments(ctx, id);
  const images = attachments.filter((a) => a.mime?.startsWith("image/"));

  const openTimer = job.timeEntries.find((e) => e.endedAt === null);
  const parts = job.lineItems.filter((li) => li.type === "PART");
  const transitions = nextStates(job.status);

  return (
    <div className="space-y-4">
      <Link href="/field" className="text-sm text-foreground/60">
        {t.field.backToMyDay}
      </Link>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/50">#{job.number}</span>
          <StatusBadge status={job.status} />
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          {job.summary}
        </h1>
        <p className="text-sm text-foreground/60">{job.customer.name}</p>
        {job.site && (
          <p className="text-sm text-foreground/50">{job.site.address}</p>
        )}
      </div>

      {job.description && (
        <p className="rounded-xl border border-black/10 p-4 text-sm text-foreground/80 dark:border-white/10">
          {job.description}
        </p>
      )}

      {/* Status workflow — big buttons */}
      {transitions.length > 0 && (
        <Section title={t.workflow}>
          <div className="grid grid-cols-2 gap-2">
            {transitions.map((to) => (
              <form key={to} action={fieldStatusAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="to" value={to} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-black/15 px-3 py-3 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  → {jobStatusTh[to]}
                </button>
              </form>
            ))}
          </div>
        </Section>
      )}

      {/* Time tracking */}
      <Section title={t.field.timeEntries}>
        {openTimer ? (
          <form action={stopTimerAction}>
            <input type="hidden" name="id" value={id} />
            <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
              {t.field.timerRunning} · {timeLabel(openTimer.startedAt)}
            </p>
            <button className="w-full rounded-md bg-red-600 px-3 py-3 text-base font-medium text-white">
              {t.field.stopTimer}
            </button>
          </form>
        ) : (
          <form action={startTimerAction}>
            <input type="hidden" name="id" value={id} />
            <button className="w-full rounded-md bg-green-600 px-3 py-3 text-base font-medium text-white">
              {t.field.startTimer}
            </button>
          </form>
        )}
        {job.timeEntries.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-foreground/60">
            {job.timeEntries.map((e) => (
              <li key={e.id}>
                {timeLabel(e.startedAt)}–{e.endedAt ? timeLabel(e.endedAt) : "…"}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Parts */}
      <Section title={t.field.parts}>
        {parts.length === 0 ? (
          <EmptyState>{t.none}</EmptyState>
        ) : (
          <ul className="space-y-1 text-sm">
            {parts.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {p.description} × {Number(p.quantity)}
                </span>
                <span className="text-foreground/60">
                  {formatMoney(
                    Math.round(Number(p.quantity) * p.unitPriceCents),
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="pt-2">
          <AddPartForm jobId={id} />
        </div>
      </Section>

      {/* Photos */}
      <Section title={t.field.photos}>
        {images.length === 0 ? (
          <EmptyState>{t.field.noPhotos}</EmptyState>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={`/api/files/${img.id}`}
                alt=""
                className="aspect-square w-full rounded-md object-cover"
              />
            ))}
          </div>
        )}
        <div className="pt-2">
          <PhotoUpload jobId={id} />
        </div>
      </Section>

      {/* Signature */}
      <Section title={t.field.signature}>
        <SignaturePad jobId={id} />
      </Section>
    </div>
  );
}
