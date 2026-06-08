import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { logActivity } from "@/server/lib/activity";
import { NotFoundError } from "@/server/modules/customer/customer.service";
import type { ContractFrequency } from "@/generated/prisma/client";

export { NotFoundError };

/** Advance a date by one contract interval. */
function advance(from: Date, freq: ContractFrequency): Date {
  const d = new Date(from);
  switch (freq) {
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      break;
    case "SEMIANNUAL":
      d.setMonth(d.getMonth() + 6);
      break;
    case "ANNUAL":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function listContracts(ctx: AuthContext) {
  return prisma.contract.findMany({
    where: { tenantId: ctx.tenantId, deletedAt: null },
    orderBy: [{ active: "desc" }, { nextRunAt: "asc" }],
    include: { customer: { select: { name: true } } },
    take: 100,
  });
}

export async function createContract(
  ctx: AuthContext,
  input: {
    customerId: string;
    name: string;
    frequency: ContractFrequency;
    nextRunAt: Date;
  },
) {
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) throw new NotFoundError("Customer");
  return prisma.contract.create({
    data: {
      tenantId: ctx.tenantId,
      customerId: input.customerId,
      name: input.name.trim(),
      frequency: input.frequency,
      nextRunAt: input.nextRunAt,
      active: true,
    },
  });
}

export async function toggleContract(ctx: AuthContext, id: string) {
  const c = await prisma.contract.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    select: { active: true },
  });
  if (!c) throw new NotFoundError("Contract");
  await prisma.contract.update({
    where: { id },
    data: { active: !c.active },
  });
}

/**
 * Generate work orders for every active contract whose nextRunAt has passed,
 * then roll nextRunAt forward. Returns how many jobs were created. (Invoked by
 * a button now; a scheduled function can call the same logic later.)
 */
export async function generateDueJobs(ctx: AuthContext): Promise<number> {
  const now = new Date();
  const due = await prisma.contract.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      active: true,
      nextRunAt: { lte: now },
    },
  });

  let created = 0;
  for (const contract of due) {
    const last = await prisma.workOrder.findFirst({
      where: { tenantId: ctx.tenantId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const number = (last?.number ?? 1000) + 1;
    await prisma.$transaction(async (tx) => {
      const job = await tx.workOrder.create({
        data: {
          tenantId: ctx.tenantId,
          number,
          customerId: contract.customerId,
          contractId: contract.id,
          status: "SCHEDULED",
          type: "MAINTENANCE",
          summary: contract.name,
        },
      });
      await tx.contract.update({
        where: { id: contract.id },
        data: {
          nextRunAt: advance(contract.nextRunAt ?? now, contract.frequency),
        },
      });
      await logActivity(
        ctx,
        "work_order",
        job.id,
        `สร้างจากสัญญาบริการ: ${contract.name}`,
        "SYSTEM",
      );
    });
    created++;
  }
  return created;
}
