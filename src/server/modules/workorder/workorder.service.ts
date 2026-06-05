import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { logActivity } from "@/server/lib/activity";
import { assertTransition } from "@/server/lib/job-state-machine";
import { totalLineItems } from "@/server/lib/money";
import { NotFoundError } from "@/server/modules/customer/customer.service";
import type { JobStatus, Prisma } from "@/generated/prisma/client";
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
} from "./workorder.schema";

export { NotFoundError };

function emptyToNull(v?: string | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

/** Tax rate (fractional) for this tenant, read from settings.taxRate. */
async function taxRate(ctx: AuthContext): Promise<number> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { settings: true },
  });
  const s = tenant?.settings as { taxRate?: number } | null;
  return typeof s?.taxRate === "number" ? s.taxRate : 0;
}

// --- Queries ---------------------------------------------------------------

export async function listWorkOrders(
  ctx: AuthContext,
  filter?: { status?: JobStatus; q?: string; mineOnly?: boolean },
) {
  return prisma.workOrder.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.q
        ? { summary: { contains: filter.q, mode: "insensitive" as const } }
        : {}),
      ...(filter?.mineOnly
        ? { assignedTech: { userId: ctx.userId } }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      customer: { select: { name: true } },
      assignedTech: { include: { user: { select: { name: true } } } },
    },
    take: 100,
  });
}

export async function getWorkOrder(ctx: AuthContext, id: string) {
  const wo = await prisma.workOrder.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true } },
      site: true,
      asset: true,
      assignedTech: { include: { user: { select: { name: true } } } },
      lineItems: { orderBy: { createdAt: "asc" } },
      invoice: { select: { id: true, number: true, status: true } },
    },
  });
  if (!wo) throw new NotFoundError("Work order");
  return wo;
}

/** Roll up line items into subtotal/tax/total cents for display. */
export async function workOrderTotals(
  ctx: AuthContext,
  lineItems: { quantity: Prisma.Decimal; unitPriceCents: number; taxable: boolean }[],
) {
  return totalLineItems(
    lineItems.map((li) => ({
      quantity: Number(li.quantity),
      unitPriceCents: li.unitPriceCents,
      taxable: li.taxable,
    })),
    await taxRate(ctx),
  );
}

/** Technicians for assignment dropdowns. */
export async function listTechnicians(ctx: AuthContext) {
  return prisma.technician.findMany({
    where: { tenantId: ctx.tenantId, deletedAt: null },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

// --- Mutations -------------------------------------------------------------

async function nextNumber(ctx: AuthContext): Promise<number> {
  const last = await prisma.workOrder.findFirst({
    where: { tenantId: ctx.tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 1000) + 1;
}

async function assertCustomer(ctx: AuthContext, customerId: string) {
  const c = await prisma.customer.findFirst({
    where: { id: customerId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!c) throw new NotFoundError("Customer");
}

export async function createWorkOrder(
  ctx: AuthContext,
  input: CreateWorkOrderInput,
) {
  await assertCustomer(ctx, input.customerId);
  const wo = await prisma.workOrder.create({
    data: {
      tenantId: ctx.tenantId,
      number: await nextNumber(ctx),
      customerId: input.customerId,
      siteId: emptyToNull(input.siteId),
      assignedTechId: emptyToNull(input.assignedTechId),
      type: input.type,
      priority: input.priority,
      summary: input.summary.trim(),
      description: emptyToNull(input.description),
    },
  });
  await logActivity(ctx, "work_order", wo.id, `Job #${wo.number} created`, "SYSTEM");
  return wo;
}

export async function updateWorkOrder(
  ctx: AuthContext,
  id: string,
  input: UpdateWorkOrderInput,
) {
  const result = await prisma.workOrder.updateMany({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    data: {
      type: input.type,
      priority: input.priority,
      summary: input.summary.trim(),
      description: emptyToNull(input.description),
      siteId: emptyToNull(input.siteId),
      scheduledStart: input.scheduledStart
        ? new Date(input.scheduledStart)
        : null,
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
    },
  });
  if (result.count === 0) throw new NotFoundError("Work order");
  await logActivity(ctx, "work_order", id, "Job details updated", "SYSTEM");
}

/** Move a job through its lifecycle, enforcing the state machine. */
export async function changeStatus(
  ctx: AuthContext,
  id: string,
  to: JobStatus,
) {
  const wo = await prisma.workOrder.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    select: { status: true, number: true },
  });
  if (!wo) throw new NotFoundError("Work order");

  assertTransition(wo.status, to); // throws InvalidTransitionError

  await prisma.workOrder.update({ where: { id }, data: { status: to } });
  await logActivity(
    ctx,
    "work_order",
    id,
    `Status: ${wo.status} → ${to}`,
    "STATUS_CHANGE",
  );
}

export async function assignTechnician(
  ctx: AuthContext,
  id: string,
  techId: string | null,
) {
  if (techId) {
    const tech = await prisma.technician.findFirst({
      where: { id: techId, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!tech) throw new NotFoundError("Technician");
  }
  const result = await prisma.workOrder.updateMany({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    data: { assignedTechId: techId },
  });
  if (result.count === 0) throw new NotFoundError("Work order");
  await logActivity(
    ctx,
    "work_order",
    id,
    techId ? "Technician assigned" : "Technician unassigned",
    "ASSIGNMENT",
  );
}

export async function deleteWorkOrder(ctx: AuthContext, id: string) {
  const result = await prisma.workOrder.updateMany({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError("Work order");
}

// --- Line items ------------------------------------------------------------

async function assertWorkOrder(ctx: AuthContext, workOrderId: string) {
  const wo = await prisma.workOrder.findFirst({
    where: { id: workOrderId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!wo) throw new NotFoundError("Work order");
}

export async function addLineItem(
  ctx: AuthContext,
  input: {
    workOrderId: string;
    type: "LABOR" | "PART" | "FEE" | "DISCOUNT";
    description: string;
    quantity: number;
    unitPriceCents: number;
  },
) {
  await assertWorkOrder(ctx, input.workOrderId);
  return prisma.jobLineItem.create({
    data: {
      tenantId: ctx.tenantId,
      workOrderId: input.workOrderId,
      type: input.type,
      description: input.description.trim(),
      quantity: input.quantity,
      unitPriceCents: input.unitPriceCents,
      taxable: input.type !== "DISCOUNT",
    },
  });
}

export async function deleteLineItem(ctx: AuthContext, id: string) {
  await prisma.jobLineItem.deleteMany({
    where: { id, tenantId: ctx.tenantId },
  });
}

// --- Notes (timeline) ------------------------------------------------------

export async function addNote(
  ctx: AuthContext,
  workOrderId: string,
  body: string,
) {
  await assertWorkOrder(ctx, workOrderId);
  await logActivity(ctx, "work_order", workOrderId, body.trim(), "NOTE");
}
