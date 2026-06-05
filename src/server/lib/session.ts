import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  MAX_AGE_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session-token";

// Cookie-bound session helpers. Pure token logic lives in ./session-token.
export { SESSION_COOKIE };
export type { SessionPayload };

/** Write the session cookie (call from a server action or route handler). */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Read & verify the session from the incoming request cookies. */
export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
