import { redirect } from "next/navigation";
import { prisma } from "./db";
import { readSession } from "./session";
import { authorize, type Action, type Resource } from "./rbac";
import type { UserRole } from "@/generated/prisma/client";

// The per-request auth context. Every tenant-scoped query derives its
// tenantId from here — never from client input (skills.md §5).
export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  name: string;
  email: string;
  tenantName: string;
}

/** Load the current user from the verified session, or null if unauthenticated. */
export async function getCurrentUser(): Promise<AuthContext | null> {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      tenantId: session.tenantId,
      active: true,
      deletedAt: null,
    },
    include: { tenant: { select: { name: true } } },
  });
  if (!user) return null;

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    name: user.name,
    email: user.email,
    tenantName: user.tenant.name,
  };
}

/** Use in server components/pages: redirect to /login when unauthenticated. */
export async function requireUser(): Promise<AuthContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require auth AND a specific permission; redirect/throw otherwise. */
export async function requirePermission(
  resource: Resource,
  action: Action,
): Promise<AuthContext> {
  const user = await requireUser();
  authorize(user.role, resource, action); // throws ForbiddenError if denied
  return user;
}
