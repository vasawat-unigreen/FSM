import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { hashPassword } from "@/server/lib/password";
import { NotFoundError } from "@/server/modules/customer/customer.service";
import type { UserRole } from "@/generated/prisma/client";

export { NotFoundError };

export class SettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsError";
  }
}

/** Merge a partial settings object into the tenant's settings jsonb. */
export async function updateTaxRate(ctx: AuthContext, rate: number) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: ctx.tenantId },
    select: { settings: true },
  });
  const current = (tenant.settings as Record<string, unknown>) ?? {};
  await prisma.tenant.update({
    where: { id: ctx.tenantId },
    data: { settings: { ...current, taxRate: rate } },
  });
}

export async function listTeam(ctx: AuthContext) {
  return prisma.user.findMany({
    where: { tenantId: ctx.tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
}

export async function addTeamMember(
  ctx: AuthContext,
  input: { name: string; email: string; role: UserRole; password: string },
) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.create({
    data: {
      tenantId: ctx.tenantId,
      name: input.name.trim(),
      email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
      // A technician needs a profile to appear on the dispatch board.
      ...(input.role === "TECHNICIAN"
        ? { technician: { create: { tenantId: ctx.tenantId } } }
        : {}),
    },
  });
  return user;
}

export async function setRole(
  ctx: AuthContext,
  userId: string,
  role: UserRole,
) {
  if (userId === ctx.userId) {
    throw new SettingsError("เปลี่ยนบทบาทของตัวเองไม่ได้");
  }
  // Ensure a technician has a profile.
  if (role === "TECHNICIAN") {
    const existing = await prisma.technician.findFirst({
      where: { userId, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!existing) {
      await prisma.technician.create({
        data: { tenantId: ctx.tenantId, userId },
      });
    }
  }
  const result = await prisma.user.updateMany({
    where: { id: userId, tenantId: ctx.tenantId, deletedAt: null },
    data: { role },
  });
  if (result.count === 0) throw new NotFoundError("User");
}

export async function setActive(
  ctx: AuthContext,
  userId: string,
  active: boolean,
) {
  if (userId === ctx.userId) {
    throw new SettingsError("เปลี่ยนสถานะของตัวเองไม่ได้");
  }
  const result = await prisma.user.updateMany({
    where: { id: userId, tenantId: ctx.tenantId, deletedAt: null },
    data: { active },
  });
  if (result.count === 0) throw new NotFoundError("User");
}
