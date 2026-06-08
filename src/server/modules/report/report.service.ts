import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import type { JobStatus } from "@/generated/prisma/client";

function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export interface Kpis {
  revenueMonthCents: number;
  revenueTotalCents: number;
  outstandingCents: number;
  openJobs: number;
  completedThisMonth: number;
  jobsByStatus: { status: JobStatus; count: number }[];
  topCustomers: { name: string; cents: number }[];
  techWorkload: { name: string; count: number }[];
}

export async function getKpis(ctx: AuthContext): Promise<Kpis> {
  const tenantId = ctx.tenantId;
  const monthStart = startOfMonth();

  const [
    revTotal,
    revMonth,
    invoices,
    openJobs,
    completedThisMonth,
    statusGroups,
    customerGroups,
    techGroups,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { tenantId }, _sum: { amountCents: true } }),
    prisma.payment.aggregate({
      where: { tenantId, paidAt: { gte: monthStart } },
      _sum: { amountCents: true },
    }),
    prisma.invoice.findMany({
      where: { tenantId, deletedAt: null, status: { in: ["SENT", "PARTIAL", "OVERDUE"] } },
      select: { totalCents: true, amountPaidCents: true },
    }),
    prisma.workOrder.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
    }),
    prisma.workOrder.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ["COMPLETED", "INVOICED", "CLOSED"] },
        updatedAt: { gte: monthStart },
      },
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      where: { tenantId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.invoice.groupBy({
      by: ["customerId"],
      where: { tenantId, deletedAt: null, amountPaidCents: { gt: 0 } },
      _sum: { amountPaidCents: true },
    }),
    prisma.workOrder.groupBy({
      by: ["assignedTechId"],
      where: {
        tenantId,
        deletedAt: null,
        status: { notIn: ["CLOSED", "CANCELLED"] },
        assignedTechId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const outstandingCents = invoices.reduce(
    (s, i) => s + (i.totalCents - i.amountPaidCents),
    0,
  );

  // Resolve names for top customers (by amount paid).
  const topCustomerRows = [...customerGroups]
    .sort((a, b) => (b._sum.amountPaidCents ?? 0) - (a._sum.amountPaidCents ?? 0))
    .slice(0, 5);
  const customers = await prisma.customer.findMany({
    where: { id: { in: topCustomerRows.map((r) => r.customerId) } },
    select: { id: true, name: true },
  });
  const cName = new Map(customers.map((c) => [c.id, c.name]));
  const topCustomers = topCustomerRows.map((r) => ({
    name: cName.get(r.customerId) ?? "—",
    cents: r._sum.amountPaidCents ?? 0,
  }));

  // Resolve names for technician workload.
  const techIds = techGroups
    .map((g) => g.assignedTechId)
    .filter((x): x is string => x !== null);
  const techs = await prisma.technician.findMany({
    where: { id: { in: techIds } },
    include: { user: { select: { name: true } } },
  });
  const tName = new Map(techs.map((t) => [t.id, t.user.name]));
  const techWorkload = techGroups
    .map((g) => ({
      name: tName.get(g.assignedTechId ?? "") ?? "—",
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    revenueTotalCents: revTotal._sum.amountCents ?? 0,
    revenueMonthCents: revMonth._sum.amountCents ?? 0,
    outstandingCents,
    openJobs,
    completedThisMonth,
    jobsByStatus: statusGroups
      .map((g) => ({ status: g.status, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    topCustomers,
    techWorkload,
  };
}

export interface Alerts {
  overdueInvoices: number;
  lowStockParts: number;
  dueContracts: number;
  unscheduledJobs: number;
}

export async function getAlerts(ctx: AuthContext): Promise<Alerts> {
  const tenantId = ctx.tenantId;
  const now = new Date();

  const [overdueInvoices, parts, dueContracts, unscheduledJobs] =
    await Promise.all([
      prisma.invoice.count({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["SENT", "PARTIAL"] },
          dueDate: { lt: now },
        },
      }),
      prisma.part.findMany({
        where: { tenantId, active: true },
        select: { qtyOnHand: true, reorderPoint: true },
      }),
      prisma.contract.count({
        where: { tenantId, deletedAt: null, active: true, nextRunAt: { lte: now } },
      }),
      prisma.workOrder.count({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["DRAFT", "SCHEDULED", "DISPATCHED"] },
          appointments: { none: {} },
        },
      }),
    ]);

  const lowStockParts = parts.filter(
    (p) => Number(p.qtyOnHand) <= Number(p.reorderPoint),
  ).length;

  return { overdueInvoices, lowStockParts, dueContracts, unscheduledJobs };
}
