import Link from "next/link";
import { requirePermission } from "@/server/lib/auth";
import { listMyJobs } from "@/server/modules/field/field.service";
import { StatusBadge, PriorityLabel } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/primitives";
import { t } from "@/i18n";

export default async function FieldHomePage() {
  const ctx = await requirePermission("job", "read");
  const today = new Date().toISOString().slice(0, 10);
  const jobs = await listMyJobs(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t.field.myDay}
        </h1>
        <p className="text-sm text-foreground/50">{today}</p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState>{t.field.noJobsToday}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/field/${job.id}`}
                className="block rounded-xl border border-black/10 p-4 active:bg-black/5 dark:border-white/10 dark:active:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/50">
                    #{job.number}
                  </span>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-1 font-medium">{job.summary}</div>
                <div className="mt-1 flex items-center justify-between text-sm text-foreground/60">
                  <span>{job.customer.name}</span>
                  <PriorityLabel priority={job.priority} />
                </div>
                {job.scheduledStart && (
                  <div className="mt-1 text-sm text-foreground/50">
                    {job.scheduledStart.toISOString().slice(11, 16)}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
