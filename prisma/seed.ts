import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  JobStatus,
  JobType,
} from "../src/generated/prisma/client";

// Demo data for local development. Idempotent: clears the demo tenant first.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_TENANT = "Acme Field Services";
// All seeded users share this password so you can log in as any role.
const DEMO_PASSWORD = "password123";

async function main() {
  // Reset demo tenant so the seed can be re-run.
  const existing = await prisma.tenant.findFirst({
    where: { name: DEMO_TENANT },
  });
  if (existing) {
    await prisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: DEMO_TENANT,
      plan: "pro",
      timezone: "America/Chicago",
    },
  });

  // --- Users & technicians -------------------------------------------------
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "owner@acme.test",
      passwordHash,
      name: "Olivia Owner",
      role: "OWNER",
    },
  });

  const dispatcher = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "dispatch@acme.test",
      passwordHash,
      name: "Dana Dispatcher",
      role: "DISPATCHER",
    },
  });

  const techUsers = await Promise.all(
    [
      { name: "Tina Tech", email: "tina@acme.test", color: "#ef4444" },
      { name: "Tom Tech", email: "tom@acme.test", color: "#22c55e" },
    ].map((t) =>
      prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: t.email,
          passwordHash,
          name: t.name,
          role: "TECHNICIAN",
          technician: {
            create: {
              tenantId: tenant.id,
              skills: ["hvac", "plumbing"],
              color: t.color,
              hourlyCostCents: 4500,
            },
          },
        },
        include: { technician: true },
      }),
    ),
  );
  const technicians = techUsers.map((u) => u.technician!);

  // --- Catalog -------------------------------------------------------------
  await prisma.serviceItem.createMany({
    data: [
      { tenantId: tenant.id, name: "Diagnostic Visit", category: "labor", priceCents: 9900, defaultDuration: 60 },
      { tenantId: tenant.id, name: "AC Tune-Up", category: "hvac", priceCents: 14900, defaultDuration: 90 },
      { tenantId: tenant.id, name: "Emergency Call-Out", category: "labor", priceCents: 19900, defaultDuration: 60 },
    ],
  });

  await prisma.part.createMany({
    data: [
      { tenantId: tenant.id, sku: "FLT-16x25", name: 'Air Filter 16x25"', costCents: 800, priceCents: 1900, qtyOnHand: 40, reorderPoint: 10 },
      { tenantId: tenant.id, sku: "CAP-45-5", name: "Dual Run Capacitor 45/5", costCents: 1200, priceCents: 3900, qtyOnHand: 12, reorderPoint: 4 },
    ],
  });

  // --- Customers, sites, assets -------------------------------------------
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Bright Smiles Dental",
      type: "COMMERCIAL",
      billingAddress: "100 Main St, Austin, TX 78701",
      contacts: {
        create: {
          tenantId: tenant.id,
          name: "Dr. Reed",
          email: "office@brightsmiles.test",
          phone: "512-555-0142",
          isPrimary: true,
        },
      },
      sites: {
        create: {
          tenantId: tenant.id,
          name: "Main Office",
          address: "100 Main St, Austin, TX 78701",
          lat: 30.2672,
          lng: -97.7431,
          accessNotes: "Suite 200, code #4417",
        },
      },
    },
    include: { sites: true },
  });

  const site = customer.sites[0];
  const asset = await prisma.asset.create({
    data: {
      tenantId: tenant.id,
      siteId: site.id,
      name: "Rooftop AC Unit",
      make: "Carrier",
      model: "48TC",
      serial: "SN-99812",
    },
  });

  // --- Work orders ---------------------------------------------------------
  await prisma.workOrder.create({
    data: {
      tenantId: tenant.id,
      number: 1001,
      customerId: customer.id,
      siteId: site.id,
      assetId: asset.id,
      assignedTechId: technicians[0].id,
      status: JobStatus.SCHEDULED,
      type: JobType.MAINTENANCE,
      summary: "Quarterly AC maintenance",
      description: "Replace filter, check refrigerant, clean coils.",
      scheduledStart: new Date("2026-06-03T14:00:00Z"),
      scheduledEnd: new Date("2026-06-03T15:30:00Z"),
      lineItems: {
        create: [
          { tenantId: tenant.id, type: "LABOR", description: "AC Tune-Up", quantity: 1, unitPriceCents: 14900 },
          { tenantId: tenant.id, type: "PART", description: 'Air Filter 16x25"', quantity: 2, unitPriceCents: 1900 },
        ],
      },
      appointments: {
        create: {
          tenantId: tenant.id,
          technicianId: technicians[0].id,
          startAt: new Date("2026-06-03T14:00:00Z"),
          endAt: new Date("2026-06-03T15:30:00Z"),
        },
      },
    },
  });

  await prisma.workOrder.create({
    data: {
      tenantId: tenant.id,
      number: 1002,
      customerId: customer.id,
      siteId: site.id,
      status: JobStatus.DRAFT,
      type: JobType.REPAIR,
      summary: "No cooling on second floor",
      priority: "HIGH",
    },
  });

  console.log(
    `Seeded tenant "${tenant.name}" with ${technicians.length} technicians, 1 customer, 2 work orders.`,
  );
  console.log(
    `Login: ${owner.email} / ${dispatcher.email} (password: ${DEMO_PASSWORD})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
