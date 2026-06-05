import type { UserRole } from "@/generated/prisma/client";

// Permission matrix: role × resource × action (skills.md §5).
// Authorization is always enforced server-side; never trust the client.

export type Resource =
  | "customer"
  | "job"
  | "schedule"
  | "estimate"
  | "invoice"
  | "payment"
  | "inventory"
  | "report"
  | "settings"
  | "user";

export type Action = "read" | "create" | "update" | "delete";

type Matrix = Record<UserRole, Partial<Record<Resource, Action[]>>>;

const ALL: Action[] = ["read", "create", "update", "delete"];
const RW: Action[] = ["read", "create", "update"];
const RO: Action[] = ["read"];

const MATRIX: Matrix = {
  OWNER: {
    customer: ALL, job: ALL, schedule: ALL, estimate: ALL, invoice: ALL,
    payment: ALL, inventory: ALL, report: ALL, settings: ALL, user: ALL,
  },
  ADMIN: {
    customer: ALL, job: ALL, schedule: ALL, estimate: ALL, invoice: ALL,
    payment: ALL, inventory: ALL, report: ALL, settings: RW, user: ALL,
  },
  DISPATCHER: {
    customer: RW, job: ALL, schedule: ALL, estimate: RW, invoice: RO,
    inventory: RO, report: RO,
  },
  TECHNICIAN: {
    // Technicians act only on their own jobs — ownership is checked separately
    // in the service layer; this grants the capability, not the row scope.
    customer: RO, job: RW, schedule: RO, inventory: RO,
  },
  ACCOUNTANT: {
    customer: RO, job: RO, estimate: RO, invoice: ALL, payment: ALL,
    report: RO,
  },
  READ_ONLY: {
    customer: RO, job: RO, schedule: RO, estimate: RO, invoice: RO,
    payment: RO, inventory: RO, report: RO,
  },
};

export function can(
  role: UserRole,
  resource: Resource,
  action: Action,
): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

export class ForbiddenError extends Error {
  constructor(role: UserRole, resource: Resource, action: Action) {
    super(`Role ${role} may not ${action} ${resource}`);
    this.name = "ForbiddenError";
  }
}

/** Throwing guard for use at the top of a service/route handler. */
export function authorize(
  role: UserRole,
  resource: Resource,
  action: Action,
): void {
  if (!can(role, resource, action)) {
    throw new ForbiddenError(role, resource, action);
  }
}
