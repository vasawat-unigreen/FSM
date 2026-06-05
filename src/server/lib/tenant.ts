import { prisma } from "./db";
import type { AuthContext } from "./auth";

/** Tenant sales-tax rate (fractional, e.g. 0.07), read from settings.taxRate. */
export async function getTaxRate(ctx: AuthContext): Promise<number> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { settings: true },
  });
  const s = tenant?.settings as { taxRate?: number } | null;
  return typeof s?.taxRate === "number" ? s.taxRate : 0;
}
