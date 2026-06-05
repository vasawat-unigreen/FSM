import { prisma } from "@/server/lib/db";
import { hashPassword, verifyPassword } from "@/server/lib/password";
import type { SessionPayload } from "@/server/lib/session";
import type { SignupInput, LoginInput } from "./auth.schema";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Provision a new tenant with its first OWNER user. The two rows are created
 * together so a signup can never leave a tenant without an owner.
 */
export async function signup(input: SignupInput): Promise<SessionPayload> {
  const email = input.email.toLowerCase().trim();

  const tenant = await prisma.tenant.create({
    data: {
      name: input.companyName.trim(),
      users: {
        create: {
          email,
          name: input.name.trim(),
          passwordHash: await hashPassword(input.password),
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });

  const owner = tenant.users[0];
  return { userId: owner.id, tenantId: tenant.id, role: owner.role };
}

/**
 * Verify credentials and return a session payload. Email is matched globally;
 * if the same email exists in multiple tenants, tenant selection would be
 * added here (out of scope for Phase 1).
 */
export async function login(input: LoginInput): Promise<SessionPayload> {
  const email = input.email.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: { email, active: true, deletedAt: null },
  });

  // Always run a compare to avoid leaking which emails exist via timing.
  const ok = user
    ? await verifyPassword(input.password, user.passwordHash)
    : await verifyPassword(input.password, "$2a$10$invalidinvalidinvalidinvalidina");

  if (!user || !ok) {
    throw new AuthError("Invalid email or password");
  }

  return { userId: user.id, tenantId: user.tenantId, role: user.role };
}
