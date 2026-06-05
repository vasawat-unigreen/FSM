import { JobStatus } from "@/generated/prisma/client";

// Job lifecycle state machine (skills.md §2 / §5). Illegal transitions are
// rejected at the service layer so we never, e.g., invoice a cancelled job.

const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.DRAFT]: [JobStatus.SCHEDULED, JobStatus.CANCELLED],
  [JobStatus.SCHEDULED]: [
    JobStatus.DISPATCHED,
    JobStatus.ON_HOLD,
    JobStatus.CANCELLED,
  ],
  [JobStatus.DISPATCHED]: [
    JobStatus.EN_ROUTE,
    JobStatus.IN_PROGRESS,
    JobStatus.ON_HOLD,
    JobStatus.CANCELLED,
  ],
  [JobStatus.EN_ROUTE]: [
    JobStatus.IN_PROGRESS,
    JobStatus.ON_HOLD,
    JobStatus.CANCELLED,
  ],
  [JobStatus.IN_PROGRESS]: [
    JobStatus.ON_HOLD,
    JobStatus.COMPLETED,
    JobStatus.CANCELLED,
  ],
  [JobStatus.ON_HOLD]: [
    JobStatus.SCHEDULED,
    JobStatus.DISPATCHED,
    JobStatus.IN_PROGRESS,
    JobStatus.CANCELLED,
  ],
  [JobStatus.COMPLETED]: [JobStatus.INVOICED, JobStatus.IN_PROGRESS],
  [JobStatus.INVOICED]: [JobStatus.CLOSED],
  [JobStatus.CLOSED]: [],
  [JobStatus.CANCELLED]: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStates(from: JobStatus): JobStatus[] {
  return TRANSITIONS[from];
}

export class InvalidTransitionError extends Error {
  constructor(from: JobStatus, to: JobStatus) {
    super(`Cannot move job from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
