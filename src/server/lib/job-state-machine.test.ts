import { describe, it, expect } from "vitest";
import { JobStatus } from "@/generated/prisma/client";
import {
  canTransition,
  assertTransition,
  InvalidTransitionError,
} from "./job-state-machine";

describe("job state machine", () => {
  it("allows the happy path through completion", () => {
    expect(canTransition(JobStatus.DRAFT, JobStatus.SCHEDULED)).toBe(true);
    expect(canTransition(JobStatus.SCHEDULED, JobStatus.DISPATCHED)).toBe(true);
    expect(canTransition(JobStatus.IN_PROGRESS, JobStatus.COMPLETED)).toBe(true);
    expect(canTransition(JobStatus.COMPLETED, JobStatus.INVOICED)).toBe(true);
  });

  it("rejects invoicing a cancelled job", () => {
    expect(canTransition(JobStatus.CANCELLED, JobStatus.INVOICED)).toBe(false);
    expect(() =>
      assertTransition(JobStatus.CANCELLED, JobStatus.INVOICED),
    ).toThrow(InvalidTransitionError);
  });

  it("treats CLOSED and CANCELLED as terminal", () => {
    expect(canTransition(JobStatus.CLOSED, JobStatus.IN_PROGRESS)).toBe(false);
    expect(canTransition(JobStatus.CANCELLED, JobStatus.SCHEDULED)).toBe(false);
  });
});
