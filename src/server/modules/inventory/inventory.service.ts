import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { NotFoundError } from "@/server/modules/customer/customer.service";

export { NotFoundError };

export async function listParts(
  ctx: AuthContext,
  opts?: { lowStockOnly?: boolean },
) {
  const parts = await prisma.part.findMany({
    where: { tenantId: ctx.tenantId, active: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  const withLow = parts.map((p) => ({
    ...p,
    low: Number(p.qtyOnHand) <= Number(p.reorderPoint),
  }));
  return opts?.lowStockOnly ? withLow.filter((p) => p.low) : withLow;
}

export async function getPart(ctx: AuthContext, id: string) {
  const part = await prisma.part.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!part) throw new NotFoundError("Part");
  return part;
}

export async function createPart(
  ctx: AuthContext,
  input: {
    sku: string;
    name: string;
    costCents: number;
    priceCents: number;
    qtyOnHand: number;
    reorderPoint: number;
  },
) {
  return prisma.part.create({
    data: {
      tenantId: ctx.tenantId,
      sku: input.sku.trim(),
      name: input.name.trim(),
      costCents: input.costCents,
      priceCents: input.priceCents,
      qtyOnHand: input.qtyOnHand,
      reorderPoint: input.reorderPoint,
    },
  });
}

export async function updatePart(
  ctx: AuthContext,
  id: string,
  input: {
    name: string;
    costCents: number;
    priceCents: number;
    reorderPoint: number;
  },
) {
  const result = await prisma.part.updateMany({
    where: { id, tenantId: ctx.tenantId },
    data: {
      name: input.name.trim(),
      costCents: input.costCents,
      priceCents: input.priceCents,
      reorderPoint: input.reorderPoint,
    },
  });
  if (result.count === 0) throw new NotFoundError("Part");
}

/** Increment/decrement stock by a signed delta. */
export async function adjustStock(
  ctx: AuthContext,
  id: string,
  deltaQty: number,
) {
  await prisma.$transaction(async (tx) => {
    const part = await tx.part.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true, qtyOnHand: true },
    });
    if (!part) throw new NotFoundError("Part");
    const next = Number(part.qtyOnHand) + deltaQty;
    await tx.part.update({
      where: { id },
      data: { qtyOnHand: next < 0 ? 0 : next },
    });
  });
}
