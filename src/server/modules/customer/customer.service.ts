import { prisma } from "@/server/lib/db";
import type { AuthContext } from "@/server/lib/auth";
import { logActivity } from "@/server/lib/activity";
import type {
  CustomerInput,
  ContactInput,
  SiteInput,
  AssetInput,
} from "./customer.schema";

export class NotFoundError extends Error {
  constructor(what = "Record") {
    super(`${what} not found`);
    this.name = "NotFoundError";
  }
}

/** Empty string -> null, so optional form fields don't store "". */
function n(v?: string | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

// --- Customers -------------------------------------------------------------

export async function listCustomers(ctx: AuthContext, query?: string) {
  return prisma.customer.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query
        ? { name: { contains: query, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { sites: true, workOrders: true } } },
    take: 100,
  });
}

export async function getCustomer(ctx: AuthContext, id: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      sites: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          assets: { where: { deletedAt: null }, orderBy: { name: "asc" } },
        },
      },
    },
  });
  if (!customer) throw new NotFoundError("Customer");
  return customer;
}

export async function createCustomer(ctx: AuthContext, input: CustomerInput) {
  const customer = await prisma.customer.create({
    data: {
      tenantId: ctx.tenantId,
      name: input.name.trim(),
      type: input.type,
      taxId: n(input.taxId),
      billingAddress: n(input.billingAddress),
      paymentTerms: input.paymentTerms,
    },
  });
  await logActivity(ctx, "customer", customer.id, "Customer created", "SYSTEM");
  return customer;
}

export async function updateCustomer(
  ctx: AuthContext,
  id: string,
  input: CustomerInput,
) {
  // Scope the update so a foreign tenant id can never match.
  const result = await prisma.customer.updateMany({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    data: {
      name: input.name.trim(),
      type: input.type,
      taxId: n(input.taxId),
      billingAddress: n(input.billingAddress),
      paymentTerms: input.paymentTerms,
    },
  });
  if (result.count === 0) throw new NotFoundError("Customer");
  await logActivity(ctx, "customer", id, "Customer updated", "SYSTEM");
}

export async function deleteCustomer(ctx: AuthContext, id: string) {
  const result = await prisma.customer.updateMany({
    where: { id, tenantId: ctx.tenantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError("Customer");
}

// --- Contacts --------------------------------------------------------------

async function assertCustomer(ctx: AuthContext, customerId: string) {
  const exists = await prisma.customer.findFirst({
    where: { id: customerId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!exists) throw new NotFoundError("Customer");
}

export async function addContact(ctx: AuthContext, input: ContactInput) {
  await assertCustomer(ctx, input.customerId);
  return prisma.contact.create({
    data: {
      tenantId: ctx.tenantId,
      customerId: input.customerId,
      name: input.name.trim(),
      email: n(input.email),
      phone: n(input.phone),
      role: n(input.role),
      isPrimary: input.isPrimary,
    },
  });
}

export async function deleteContact(ctx: AuthContext, id: string) {
  await prisma.contact.deleteMany({
    where: { id, tenantId: ctx.tenantId },
  });
}

// --- Sites -----------------------------------------------------------------

export async function addSite(ctx: AuthContext, input: SiteInput) {
  await assertCustomer(ctx, input.customerId);
  const site = await prisma.site.create({
    data: {
      tenantId: ctx.tenantId,
      customerId: input.customerId,
      name: n(input.name),
      address: input.address.trim(),
      accessNotes: n(input.accessNotes),
      gateCode: n(input.gateCode),
    },
  });
  await logActivity(
    ctx,
    "customer",
    input.customerId,
    `Site added: ${site.address}`,
    "SYSTEM",
  );
  return site;
}

// --- Assets ----------------------------------------------------------------

export async function addAsset(ctx: AuthContext, input: AssetInput) {
  const site = await prisma.site.findFirst({
    where: { id: input.siteId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true, customerId: true },
  });
  if (!site) throw new NotFoundError("Site");

  const asset = await prisma.asset.create({
    data: {
      tenantId: ctx.tenantId,
      siteId: site.id,
      name: input.name.trim(),
      make: n(input.make),
      model: n(input.model),
      serial: n(input.serial),
    },
  });
  await logActivity(
    ctx,
    "customer",
    site.customerId,
    `Asset added: ${asset.name}`,
    "SYSTEM",
  );
  return asset;
}
