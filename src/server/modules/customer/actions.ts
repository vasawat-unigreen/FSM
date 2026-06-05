"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import {
  customerSchema,
  contactSchema,
  siteSchema,
  assetSchema,
} from "./customer.schema";
import * as service from "./customer.service";

export interface FormState {
  error?: string;
  ok?: boolean;
}

function firstError(err: z.ZodError): string {
  return z.flattenError(err).formErrors[0] ?? "Please check the form and try again.";
}

// --- Customer create / update / delete -------------------------------------

export async function createCustomerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("customer", "create");
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const customer = await service.createCustomer(ctx, parsed.data);
  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("customer", "update");
  const id = String(formData.get("id") ?? "");
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await service.updateCustomer(ctx, id, parsed.data);
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("customer", "delete");
  await service.deleteCustomer(ctx, String(formData.get("id") ?? ""));
  revalidatePath("/customers");
  redirect("/customers");
}

// --- Contacts --------------------------------------------------------------

export async function addContactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("customer", "update");
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await service.addContact(ctx, parsed.data);
  revalidatePath(`/customers/${parsed.data.customerId}`);
  return { ok: true };
}

export async function deleteContactAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("customer", "update");
  await service.deleteContact(ctx, String(formData.get("id") ?? ""));
  revalidatePath(`/customers/${String(formData.get("customerId") ?? "")}`);
}

// --- Sites -----------------------------------------------------------------

export async function addSiteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("customer", "update");
  const parsed = siteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await service.addSite(ctx, parsed.data);
  revalidatePath(`/customers/${parsed.data.customerId}`);
  return { ok: true };
}

// --- Assets ----------------------------------------------------------------

export async function addAssetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("customer", "update");
  const parsed = assetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await service.addAsset(ctx, parsed.data);
  // The detail page is keyed by customerId, passed alongside for revalidation.
  revalidatePath(`/customers/${String(formData.get("customerId") ?? "")}`);
  return { ok: true };
}
