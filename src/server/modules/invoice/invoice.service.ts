import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { logActivity } from "@/server/lib/activity";
import { totalLineItems } from "@/server/lib/money";
import { getTaxRate } from "@/server/lib/tenant";
import { NotFoundError } from "@/server/modules/customer/customer.service";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/client";

export { NotFoundError };

export class InvoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceError";
  }
}

async function nextNumber(ctx: AuthContext): Promise<number> {
  const last = await prisma.invoice.findFirst({
    where: { tenantId: ctx.tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 1000) + 1;
}

// --- Queries ---------------------------------------------------------------

export async function listInvoices(
  ctx: AuthContext,
  filter?: { status?: InvoiceStatus },
) {
  return prisma.invoice.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(filter?.status ? { status: filter.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
    take: 100,
  });
}

/** Total outstanding (sent/partial/overdue) receivables for the tenant. */
export async function outstandingCents(ctx: AuthContext): Promise<number> {
  const rows = await prisma.invoice.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
    },
    select: { totalCents: true, amountPaidCents: true },
  });
  return rows.reduce((sum, r) => sum + (r.totalCents - r.amountPaidCents), 0);
}

export async function getInvoice(ctx: AuthContext, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true, billingAddress: true } },
      workOrder: { select: { id: true, number: true } },
      lineItems: { orderBy: { id: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) throw new NotFoundError("Invoice");
  return invoice;
}

// --- Create from job -------------------------------------------------------

export async function createInvoiceFromJob(
  ctx: AuthContext,
  workOrderId: string,
) {
  const job = await prisma.workOrder.findFirst({
    where: { id: workOrderId, tenantId: ctx.tenantId, deletedAt: null },
    include: { lineItems: true, invoice: { select: { id: true } } },
  });
  if (!job) throw new NotFoundError("Work order");
  if (job.invoice) throw new InvoiceError("งานนี้มีใบแจ้งหนี้แล้ว");
  if (job.status !== "COMPLETED") {
    throw new InvoiceError("ต้องปิดงาน (เสร็จ) ก่อนจึงจะออกใบแจ้งหนี้ได้");
  }

  const taxRate = await getTaxRate(ctx);
  const totals = totalLineItems(
    job.lineItems.map((li) => ({
      quantity: Number(li.quantity),
      unitPriceCents: li.unitPriceCents,
      taxable: li.taxable,
    })),
    taxRate,
  );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // net 30 default

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        number: await nextNumber(ctx),
        customerId: job.customerId,
        workOrderId: job.id,
        status: "DRAFT",
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        dueDate,
        lineItems: {
          create: job.lineItems.map((li) => ({
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
    // COMPLETED -> INVOICED
    await tx.workOrder.update({
      where: { id: job.id },
      data: { status: "INVOICED" },
    });
    return created;
  });

  await logActivity(
    ctx,
    "work_order",
    job.id,
    `ออกใบแจ้งหนี้ #${invoice.number}`,
    "SYSTEM",
  );
  await logActivity(ctx, "invoice", invoice.id, "สร้างใบแจ้งหนี้", "SYSTEM");
  return invoice;
}

// --- Lifecycle -------------------------------------------------------------

export async function sendInvoice(ctx: AuthContext, id: string) {
  const result = await prisma.invoice.updateMany({
    where: { id, tenantId: ctx.tenantId, status: "DRAFT" },
    data: { status: "SENT", issuedAt: new Date() },
  });
  if (result.count === 0) throw new InvoiceError("ส่งใบแจ้งหนี้ไม่ได้");
  await logActivity(ctx, "invoice", id, "ส่งใบแจ้งหนี้", "STATUS_CHANGE");
}

export async function voidInvoice(ctx: AuthContext, id: string) {
  const inv = await prisma.invoice.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    select: { status: true },
  });
  if (!inv) throw new NotFoundError("Invoice");
  if (inv.status === "PAID") throw new InvoiceError("ใบแจ้งหนี้ที่ชำระแล้วยกเลิกไม่ได้");
  await prisma.invoice.update({ where: { id }, data: { status: "VOID" } });
  await logActivity(ctx, "invoice", id, "ยกเลิกใบแจ้งหนี้", "STATUS_CHANGE");
}

// --- Payments --------------------------------------------------------------

export async function recordPayment(
  ctx: AuthContext,
  invoiceId: string,
  amountCents: number,
  method: PaymentMethod,
) {
  if (amountCents <= 0) throw new InvoiceError("จำนวนเงินต้องมากกว่า 0");

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId, deletedAt: null },
  });
  if (!invoice) throw new NotFoundError("Invoice");
  if (invoice.status === "VOID") throw new InvoiceError("ใบแจ้งหนี้ถูกยกเลิกแล้ว");

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        tenantId: ctx.tenantId,
        invoiceId,
        amountCents,
        method,
      },
    });
    const paid = invoice.amountPaidCents + amountCents;
    const status = paid >= invoice.totalCents ? "PAID" : "PARTIAL";
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { amountPaidCents: paid, status },
    });
    // Fully paid: close the linked job.
    if (status === "PAID" && invoice.workOrderId) {
      await tx.workOrder.updateMany({
        where: { id: invoice.workOrderId, status: "INVOICED" },
        data: { status: "CLOSED" },
      });
    }
  });

  await logActivity(ctx, "invoice", invoiceId, `รับชำระเงิน`, "PAYMENT");
}
