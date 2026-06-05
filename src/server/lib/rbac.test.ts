import { describe, it, expect } from "vitest";
import { can, authorize, ForbiddenError } from "./rbac";

describe("rbac", () => {
  it("lets owners do everything", () => {
    expect(can("OWNER", "invoice", "delete")).toBe(true);
    expect(can("OWNER", "settings", "update")).toBe(true);
  });

  it("restricts technicians to job/customer read-write, no invoicing", () => {
    expect(can("TECHNICIAN", "job", "update")).toBe(true);
    expect(can("TECHNICIAN", "invoice", "read")).toBe(false);
    expect(can("TECHNICIAN", "settings", "read")).toBe(false);
  });

  it("gives accountants invoice/payment control but read-only jobs", () => {
    expect(can("ACCOUNTANT", "invoice", "create")).toBe(true);
    expect(can("ACCOUNTANT", "job", "update")).toBe(false);
  });

  it("authorize throws ForbiddenError when denied", () => {
    expect(() => authorize("READ_ONLY", "job", "create")).toThrow(
      ForbiddenError,
    );
  });
});
