"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import { roundCents } from "@/server/lib/money";
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  statusSchema,
  assignSchema,
  lineItemSchema,
  noteSchema,
} from "./workorder.schema";
import * as service from "./workorder.service";

export interface FormState {
  error?: string;
  ok?: boolean;
}

function firstError(err: z.ZodError): string {
  return z.flattenError(err).formErrors[0] ?? "Please check the form.";
}

export async function createJobAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "create");
  const parsed = createWorkOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const wo = await service.createWorkOrder(ctx, parsed.data);
  revalidatePath("/jobs");
  redirect(`/jobs/${wo.id}`);
}

export async function updateJobAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "update");
  const id = String(formData.get("id") ?? "");
  const parsed = updateWorkOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await service.updateWorkOrder(ctx, id, parsed.data);
  revalidatePath(`/jobs/${id}`);
  redirect(`/jobs/${id}`);
}

export async function changeStatusAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "update");
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  try {
    await service.changeStatus(ctx, parsed.data.id, parsed.data.to);
  } catch {
    // Illegal transition / not found: revalidate so UI reflects true state.
  }
  revalidatePath(`/jobs/${parsed.data.id}`);
}

export async function assignTechAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "update");
  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await service.assignTechnician(
    ctx,
    parsed.data.id,
    parsed.data.assignedTechId ? parsed.data.assignedTechId : null,
  );
  revalidatePath(`/jobs/${parsed.data.id}`);
}

export async function addLineItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "update");
  const parsed = lineItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await service.addLineItem(ctx, {
    workOrderId: parsed.data.workOrderId,
    type: parsed.data.type,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unitPriceCents: roundCents(parsed.data.unitPrice * 100),
  });
  revalidatePath(`/jobs/${parsed.data.workOrderId}`);
  return { ok: true };
}

export async function deleteLineItemAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "update");
  await service.deleteLineItem(ctx, String(formData.get("id") ?? ""));
  revalidatePath(`/jobs/${String(formData.get("workOrderId") ?? "")}`);
}

export async function addNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "update");
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await service.addNote(ctx, parsed.data.workOrderId, parsed.data.body);
  revalidatePath(`/jobs/${parsed.data.workOrderId}`);
  return { ok: true };
}

export async function deleteJobAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "delete");
  await service.deleteWorkOrder(ctx, String(formData.get("id") ?? ""));
  revalidatePath("/jobs");
  redirect("/jobs");
}
