import type { Resource } from "@/server/lib/rbac";
import { t } from "@/i18n";

// Sidebar navigation, one entry per app module (skills.md §3). `resource` ties
// each item to the RBAC matrix so the shell can hide what a role can't read.
export interface NavItem {
  label: string;
  href: string;
  resource: Resource;
  phase: number;
}

export const NAV: NavItem[] = [
  { label: t.nav.dashboard, href: "/dashboard", resource: "report", phase: 0 },
  { label: t.report.title, href: "/reports", resource: "report", phase: 9 },
  { label: t.nav.customers, href: "/customers", resource: "customer", phase: 2 },
  { label: t.nav.jobs, href: "/jobs", resource: "job", phase: 3 },
  { label: t.nav.schedule, href: "/schedule", resource: "schedule", phase: 4 },
  { label: t.contract.title, href: "/contracts", resource: "job", phase: 8 },
  { label: t.nav.estimates, href: "/estimates", resource: "estimate", phase: 7 },
  { label: t.nav.invoices, href: "/invoices", resource: "invoice", phase: 6 },
  { label: t.nav.inventory, href: "/inventory", resource: "inventory", phase: 8 },
  { label: t.nav.settings, href: "/settings", resource: "settings", phase: 1 },
];
