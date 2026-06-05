// All money in the system is stored and passed around as integer cents.
// This module is the single place that knows how to total a set of line items
// and apply tax — used by estimates, jobs, and invoices alike (skills.md §5).

export type Cents = number;

export interface PricedLineItem {
  quantity: number; // may be fractional (hours, lbs)
  unitPriceCents: Cents;
  taxable: boolean;
}

export interface Totals {
  subtotalCents: Cents;
  taxCents: Cents;
  totalCents: Cents;
}

/** Round half-up to a whole cent. Never let floats leak into stored money. */
export function roundCents(value: number): Cents {
  return Math.round(value);
}

/**
 * Total a set of line items at a given tax rate.
 * @param taxRate fractional rate, e.g. 0.0825 for 8.25%
 */
export function totalLineItems(
  items: PricedLineItem[],
  taxRate = 0,
): Totals {
  let subtotal = 0;
  let taxable = 0;

  for (const item of items) {
    const line = roundCents(item.quantity * item.unitPriceCents);
    subtotal += line;
    if (item.taxable) taxable += line;
  }

  const taxCents = roundCents(taxable * taxRate);
  return {
    subtotalCents: subtotal,
    taxCents,
    totalCents: subtotal + taxCents,
  };
}

/** Format cents as a currency string for display. */
export function formatMoney(
  cents: Cents,
  currency = "THB",
  locale = "th-TH",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
