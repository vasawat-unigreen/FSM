import { randomUUID } from "node:crypto";
import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { logActivity } from "@/server/lib/activity";
import { totalLineItems } from "@/server/lib/money";
import { getTaxRate } from "@/server/lib/tenant";
import { NotFoundError } from "@/server/modules/customer/customer.service";
import type { LineItemType } from "@/generated/prisma/client";

export { NotFoundError };

export class EstimateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EstimateError";
  }
}

async function nextNumber(ctx: AuthContext): Promise<number> {
  const last = await prisma.estimate.findFirst({
    where: { tenantId: ctx.tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 1000) + 1;
}

/** Recompute and persist subtotal/tax/total from the estimate's line items. */
async function recalc(ctx: AuthContext, estimateId: string) {
  const items = await prisma.estimateLineItem.findMany({
    where: { estimateId },
  });
  const totals = totalLineItems(
    items.map((li) => ({
      quantity: Number(li.quantity),
      unitPriceCents: li.unitPriceCents,
      taxable: li.taxable,
    })),
    await getTaxRate(ctx),
  );
  await prisma.estimate.update({
    where: { id: estimateId },
    data: {
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
    },
  });
}

// --- Queries ---------------------------------------------------------------

export async function listEstimates(ctx: AuthContext) {
  return prisma.estimate.findMany({
    where: { tenantId: ctx.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
    take: 100,
  });
}

export async function getEstimate(ctx: AuthContext, id: string) {
  const est = await prisma.estimate.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true } },
      lineItems: { orderBy: { id: "asc" } },
    },
  });
  if (!est) throw new NotFoundError("Estimate");
  return est;
}

/** Public lookup by approval token — no tenant scoping (token is the secret). */
export async function getEstimateByToken(token: string) {
  return prisma.estimate.findFirst({
    where: { approvalToken: token, deletedAt: null },
    include: {
      customer: { select: { name: true } },
      tenant: { select: { name: true } },
      lineItems: { orderBy: { id: "asc" } },
    },
  });
}

// --- Mutations -------------------------------------------------------------

export async function createEstimate(ctx: AuthContext, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) throw new NotFoundError("Customer");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return prisma.estimate.create({
    data: {
      tenantId: ctx.tenantId,
      number: await nextNumber(ctx),
      customerId,
      status: "DRAFT",
      expiresAt,
    },
  });
}

async function assertDraft(ctx: AuthContext, estimateId: string) {
  const est = await prisma.estimate.findFirst({
    where: { id: estimateId, tenantId: ctx.tenantId, deletedAt: null },
    select: { status: true },
  });
  if (!est) throw new NotFoundError("Estimate");
  if (est.status !== "DRAFT") {
    throw new EstimateError("แก้ไขได้เฉพาะใบเสนอราคาฉบับร่าง");
  }
}

export async function addLineItem(
  ctx: AuthContext,
  input: {
    estimateId: string;
    type: LineItemType;
    description: string;
    quantity: number;
    unitPriceCents: number;
  },
) {
  await assertDraft(ctx, input.estimateId);
  await prisma.estimateLineItem.create({
    data: {
      tenantId: ctx.tenantId,
      estimateId: input.estimateId,
      type: input.type,
      description: input.description.trim(),
      quantity: input.quantity,
      unitPriceCents: input.unitPriceCents,
      taxable: input.type !== "DISCOUNT",
    },
  });
  await recalc(ctx, input.estimateId);
}

export async function deleteLineItem(
  ctx: AuthContext,
  estimateId: string,
  itemId: string,
) {
  await assertDraft(ctx, estimateId);
  await prisma.estimateLineItem.deleteMany({
    where: { id: itemId, tenantId: ctx.tenantId, estimateId },
  });
  await recalc(ctx, estimateId);
}

/** Move DRAFT -> SENT and mint a public approval token. */
export async function sendEstimate(ctx: AuthContext, id: string) {
  const result = await prisma.estimate.updateMany({
    where: { id, tenantId: ctx.tenantId, status: "DRAFT" },
    data: { status: "SENT", approvalToken: randomUUID() },
  });
  if (result.count === 0) throw new EstimateError("ส่งใบเสนอราคาไม่ได้");
  await logActivity(ctx, "estimate", id, "ส่งใบเสนอราคาให้ลูกค้า", "STATUS_CHANGE");
}

/** Customer decision via the public portal (token-validated, no auth). */
export async function decideByToken(token: string, approve: boolean) {
  const est = await prisma.estimate.findFirst({
    where: { approvalToken: token, deletedAt: null },
    select: { id: true, status: true, expiresAt: true },
  });
  if (!est) throw new NotFoundError("Estimate");
  if (est.status !== "SENT") return; // already decided/converted — idempotent
  if (est.expiresAt && est.expiresAt < new Date()) {
    await prisma.estimate.update({
      where: { id: est.id },
      data: { status: "EXPIRED" },
    });
    throw new EstimateError("ใบเสนอราคาหมดอายุแล้ว");
  }
  await prisma.estimate.update({
    where: { id: est.id },
    data: { status: approve ? "APPROVED" : "REJECTED" },
  });
}

/** Convert an APPROVED estimate into a scheduled-able job. */
export async function convertToJob(ctx: AuthContext, id: string) {
  const est = await prisma.estimate.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    include: { lineItems: true },
  });
  if (!est) throw new NotFoundError("Estimate");
  if (est.status !== "APPROVED") {
    throw new EstimateError("แปลงเป็นงานได้เฉพาะใบเสนอราคาที่อนุมัติแล้ว");
  }

  const last = await prisma.workOrder.findFirst({
    where: { tenantId: ctx.tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 1000) + 1;

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.workOrder.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        customerId: est.customerId,
        status: "DRAFT",
        type: "INSTALL",
        summary: `จากใบเสนอราคา #${est.number}`,
        lineItems: {
          create: est.lineItems.map((li) => ({
            tenantId: ctx.tenantId,
            type: li.type,
            description: li.description,
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
            taxable: li.taxable,
          })),
        },
      },
    });
    await tx.estimate.update({
      where: { id: est.id },
      data: { status: "CONVERTED" },
    });
    return created;
  });

  await logActivity(ctx, "estimate", id, `แปลงเป็นงาน #${job.number}`, "SYSTEM");
  await logActivity(ctx, "work_order", job.id, `สร้างจากใบเสนอราคา #${est.number}`, "SYSTEM");
  return job;
}
