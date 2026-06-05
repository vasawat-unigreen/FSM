import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { logActivity } from "@/server/lib/activity";
import { saveFile } from "@/server/lib/storage";
import { NotFoundError } from "@/server/modules/customer/customer.service";

export { NotFoundError };

/**
 * Load a job the current user is allowed to work in the field. Technicians may
 * only touch jobs assigned to them; office roles may view any tenant job.
 */
export async function getMyJob(ctx: AuthContext, id: string) {
  const job = await prisma.workOrder.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    include: {
      customer: { select: { name: true } },
      site: true,
      assignedTech: { select: { userId: true } },
      lineItems: { orderBy: { createdAt: "asc" } },
      timeEntries: { orderBy: { startedAt: "desc" } },
    },
  });
  if (!job) throw new NotFoundError("Work order");
  if (ctx.role === "TECHNICIAN" && job.assignedTech?.userId !== ctx.userId) {
    throw new NotFoundError("Work order");
  }
  return job;
}

/**
 * A technician's open jobs (anything not closed/cancelled), soonest-scheduled
 * first. Today's work naturally sorts to the top; overdue and unscheduled jobs
 * stay visible so nothing falls through the cracks.
 */
export async function listMyJobs(ctx: AuthContext) {
  const tech = await prisma.technician.findFirst({
    where: { tenantId: ctx.tenantId, userId: ctx.userId },
    select: { id: true },
  });
  if (!tech) return [];

  return prisma.workOrder.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      assignedTechId: tech.id,
      status: { notIn: ["CLOSED", "CANCELLED"] },
    },
    orderBy: [{ scheduledStart: "asc" }, { createdAt: "asc" }],
    include: { customer: { select: { name: true } } },
  });
}

async function assertMyJob(ctx: AuthContext, jobId: string) {
  await getMyJob(ctx, jobId); // throws if not allowed
}

// --- Time tracking (check-in / check-out) ---------------------------------

export async function openTimeEntry(ctx: AuthContext, jobId: string) {
  await assertMyJob(ctx, jobId);
  const tech = await prisma.technician.findFirstOrThrow({
    where: { tenantId: ctx.tenantId, userId: ctx.userId },
    select: { id: true },
  });
  // Don't open a second running timer for the same job.
  const open = await prisma.timeEntry.findFirst({
    where: { workOrderId: jobId, technicianId: tech.id, endedAt: null },
    select: { id: true },
  });
  if (open) return;

  await prisma.timeEntry.create({
    data: {
      tenantId: ctx.tenantId,
      workOrderId: jobId,
      technicianId: tech.id,
      startedAt: new Date(),
    },
  });
  await logActivity(ctx, "work_order", jobId, "เช็คอิน เริ่มจับเวลา", "SYSTEM");
}

export async function closeTimeEntry(ctx: AuthContext, jobId: string) {
  await assertMyJob(ctx, jobId);
  const tech = await prisma.technician.findFirstOrThrow({
    where: { tenantId: ctx.tenantId, userId: ctx.userId },
    select: { id: true },
  });
  await prisma.timeEntry.updateMany({
    where: { workOrderId: jobId, technicianId: tech.id, endedAt: null },
    data: { endedAt: new Date() },
  });
  await logActivity(ctx, "work_order", jobId, "เช็คเอาท์ หยุดจับเวลา", "SYSTEM");
}

// --- Parts -----------------------------------------------------------------

export async function addPart(
  ctx: AuthContext,
  jobId: string,
  description: string,
  quantity: number,
  unitPriceCents: number,
) {
  await assertMyJob(ctx, jobId);
  await prisma.jobLineItem.create({
    data: {
      tenantId: ctx.tenantId,
      workOrderId: jobId,
      type: "PART",
      description: description.trim(),
      quantity,
      unitPriceCents,
      taxable: true,
    },
  });
}

// --- Attachments (photos, signature) ---------------------------------------

export async function addAttachment(
  ctx: AuthContext,
  jobId: string,
  bytes: Buffer,
  mime: string,
) {
  await assertMyJob(ctx, jobId);
  const fileId = await saveFile(bytes);
  return prisma.attachment.create({
    data: {
      tenantId: ctx.tenantId,
      parentType: "work_order",
      parentId: jobId,
      url: fileId,
      mime,
      uploadedById: ctx.userId,
    },
  });
}

export async function listAttachments(ctx: AuthContext, jobId: string) {
  return prisma.attachment.findMany({
    where: { tenantId: ctx.tenantId, parentType: "work_order", parentId: jobId },
    orderBy: { createdAt: "desc" },
  });
}
