import { prisma } from "./db";
import type { AuthContext } from "./auth";
import type { ActivityKind } from "@/generated/prisma/client";

// Append-only activity log powering history timelines (skills.md §5). Always
// tenant-scoped and attributed to the acting user.
export type ParentType =
  | "customer"
  | "site"
  | "asset"
  | "work_order"
  | "invoice"
  | "estimate";

export async function logActivity(
  ctx: AuthContext,
  parentType: ParentType,
  parentId: string,
  body: string,
  kind: ActivityKind = "NOTE",
): Promise<void> {
  await prisma.activity.create({
    data: {
      tenantId: ctx.tenantId,
      parentType,
      parentId,
      kind,
      body,
      authorId: ctx.userId,
    },
  });
}

export async function listActivity(
  ctx: AuthContext,
  parentType: ParentType,
  parentId: string,
) {
  return prisma.activity.findMany({
    where: { tenantId: ctx.tenantId, parentType, parentId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
    take: 50,
  });
}
