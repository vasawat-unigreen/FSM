import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/generated/prisma/client";

// Pure session-token logic (no request/cookie access) so it can be unit tested
// and reused on the edge.

export const SESSION_COOKIE = "fsm_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — stay signed in

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
}

function secretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ??
    "dev-only-secret-change-me-please-0123456789abcdef";
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.tenantId === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role as UserRole,
      };
    }
    return null;
  } catch {
    return null;
  }
}
