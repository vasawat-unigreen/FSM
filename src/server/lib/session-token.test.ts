import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./session-token";

describe("session token", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSession({
      userId: "u1",
      tenantId: "t1",
      role: "OWNER",
    });
    const payload = await verifySession(token);
    expect(payload).toEqual({ userId: "u1", tenantId: "t1", role: "OWNER" });
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({
      userId: "u1",
      tenantId: "t1",
      role: "OWNER",
    });
    expect(await verifySession(token + "x")).toBeNull();
    expect(await verifySession("not.a.jwt")).toBeNull();
  });
});
