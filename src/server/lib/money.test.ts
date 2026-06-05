import { describe, it, expect } from "vitest";
import { totalLineItems, formatMoney, roundCents } from "./money";

describe("money", () => {
  it("totals line items with no tax", () => {
    const t = totalLineItems([
      { quantity: 2, unitPriceCents: 1900, taxable: true },
      { quantity: 1, unitPriceCents: 14900, taxable: true },
    ]);
    expect(t.subtotalCents).toBe(18700);
    expect(t.taxCents).toBe(0);
    expect(t.totalCents).toBe(18700);
  });

  it("applies tax only to taxable lines", () => {
    const t = totalLineItems(
      [
        { quantity: 1, unitPriceCents: 10000, taxable: true },
        { quantity: 1, unitPriceCents: 10000, taxable: false },
      ],
      0.0825,
    );
    expect(t.subtotalCents).toBe(20000);
    expect(t.taxCents).toBe(825); // tax on the taxable 10000 only
    expect(t.totalCents).toBe(20825);
  });

  it("handles fractional quantities (labor hours) and rounds cents", () => {
    const t = totalLineItems([
      { quantity: 1.5, unitPriceCents: 4533, taxable: true },
    ]);
    expect(t.subtotalCents).toBe(roundCents(1.5 * 4533));
    expect(Number.isInteger(t.subtotalCents)).toBe(true);
  });

  it("formats cents as currency", () => {
    expect(formatMoney(18700, "USD", "en-US")).toBe("$187.00");
  });
});
