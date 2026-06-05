import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { logActivity } from "@/server/lib/activity";
import { NotFoundError } from "@/server/modules/customer/customer.service";

export { NotFoundError };

export class ConflictError extends Error {
  constructor() {
    super("Appointment overlaps an existing one for this technician");
    this.name = "ConflictError";
  }
}

/** Inclusive day bounds in UTC for a yyyy-MM-dd string. */
export function dayBounds(date: string): { from: Date; to: Date } {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(`${date}T23:59:59.999Z`);
  return { from, to };
}

export async function listAppointments(
  ctx: AuthContext,
  from: Date,
  to: Date,
  opts?: { mineOnly?: boolean },
) {
  return prisma.appointment.findMany({
    where: {
      tenantId: ctx.tenantId,
      startAt: { gte: from, lte: to },
      ...(opts?.mineOnly ? { technician: { userId: ctx.userId } } : {}),
    },
    orderBy: { startAt: "asc" },
    include: {
      technician: { include: { user: { select: { name: true } } } },
      workOrder: {
        select: {
          id: true,
          number: true,
          summary: true,
          status: true,
          customer: { select: { name: true } },
        },
      },
    },
  });
}

/** Jobs that still need a calendar slot (active status, no appointment yet). */
export async function listUnscheduledJobs(ctx: AuthContext) {
  return prisma.workOrder.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      status: { in: ["DRAFT", "SCHEDULED", "DISPATCHED"] },
      appointments: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
    take: 50,
  });
}

/** True if the technician already has an overlapping appointment. */
async function hasConflict(
  ctx: AuthContext,
  technicianId: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string,
): Promise<boolean> {
  const clash = await prisma.appointment.findFirst({
    where: {
      tenantId: ctx.tenantId,
      technicianId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return clash !== null;
}

async function assertTech(ctx: AuthContext, technicianId: string) {
  const tech = await prisma.technician.findFirst({
    where: { id: technicianId, tenantId: ctx.tenantId },
    select: { id: true },
  });
  if (!tech) throw new NotFoundError("Technician");
}

export async function createAppointment(
  ctx: AuthContext,
  input: {
    workOrderId: string;
    technicianId: string;
    startAt: Date;
    endAt: Date;
  },
) {
  await assertTech(ctx, input.technicianId);
  const wo = await prisma.workOrder.findFirst({
    where: { id: input.workOrderId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true, status: true, number: true },
  });
  if (!wo) throw new NotFoundError("Work order");

  if (await hasConflict(ctx, input.technicianId, input.startAt, input.endAt)) {
    throw new ConflictError();
  }

  const appt = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
      data: {
        tenantId: ctx.tenantId,
        workOrderId: input.workOrderId,
        technicianId: input.technicianId,
        startAt: input.startAt,
        endAt: input.endAt,
      },
    });
    // Scheduling a job also assigns the tech, sets the window, and (from
    // DRAFT) advances it to SCHEDULED.
    await tx.workOrder.update({
      where: { id: input.workOrderId },
      data: {
        assignedTechId: input.technicianId,
        scheduledStart: input.startAt,
        scheduledEnd: input.endAt,
        ...(wo.status === "DRAFT" ? { status: "SCHEDULED" } : {}),
      },
    });
    return created;
  });

  await logActivity(
    ctx,
    "work_order",
    input.workOrderId,
    `จัดตารางนัดหมายแล้ว`,
    "SYSTEM",
  );
  return appt;
}

/** Move an appointment to a different technician and/or time slot. */
export async function moveAppointment(
  ctx: AuthContext,
  id: string,
  input: { technicianId?: string; startAt?: Date; endAt?: Date },
) {
  const appt = await prisma.appointment.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!appt) throw new NotFoundError("Appointment");

  const technicianId = input.technicianId ?? appt.technicianId;
  const startAt = input.startAt ?? appt.startAt;
  const endAt = input.endAt ?? appt.endAt;
  if (input.technicianId) await assertTech(ctx, technicianId);

  if (await hasConflict(ctx, technicianId, startAt, endAt, id)) {
    throw new ConflictError();
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id },
      data: { technicianId, startAt, endAt },
    });
    await tx.workOrder.update({
      where: { id: appt.workOrderId },
      data: {
        assignedTechId: technicianId,
        scheduledStart: startAt,
        scheduledEnd: endAt,
      },
    });
  });

  await logActivity(
    ctx,
    "work_order",
    appt.workOrderId,
    "ย้าย/เปลี่ยนนัดหมาย",
    "ASSIGNMENT",
  );
}

export async function deleteAppointment(ctx: AuthContext, id: string) {
  await prisma.appointment.deleteMany({
    where: { id, tenantId: ctx.tenantId },
  });
}
