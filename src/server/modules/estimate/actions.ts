"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import { roundCents } from "@/server/lib/money";
import * as service from "./estimate.service";

export interface FormState {
  error?: string;
  ok?: boolean;
}

export async function createEstimateAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("estimate", "create");
  const customerId = String(formData.get("customerId") ?? "");
  const est = await service.createEstimate(ctx, customerId);
  revalidatePath("/estimates");
  redirect(`/estimates/${est.id}`);
}

const lineItemSchema = z.object({
  estimateId: z.string().uuid(),
  type: z.enum(["LABOR", "PART", "FEE", "DISCOUNT"]).default("LABOR"),
  description: z.string().min(1, "กรอกรายละเอียด"),
  quantity: z.coerce.number().positive().default(1),
  unitPrice: z.coerce.number().min(0).default(0),
});

export async function addEstimateItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("estimate", "update");
  const parsed = lineItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" };
  }
  await service.addLineItem(ctx, {
    estimateId: parsed.data.estimateId,
    type: parsed.data.type,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unitPriceCents: roundCents(parsed.data.unitPrice * 100),
  });
  revalidatePath(`/estimates/${parsed.data.estimateId}`);
  return { ok: true };
}

export async function deleteEstimateItemAction(
  formData: FormData,
): Promise<void> {
  const ctx = await requirePermission("estimate", "update");
  const estimateId = String(formData.get("estimateId") ?? "");
  await service.deleteLineItem(ctx, estimateId, String(formData.get("id") ?? ""));
  revalidatePath(`/estimates/${estimateId}`);
}

export async function sendEstimateAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("estimate", "update");
  const id = String(formData.get("id") ?? "");
  try {
    await service.sendEstimate(ctx, id);
  } catch {
    /* revalidate shows true state */
  }
  revalidatePath(`/estimates/${id}`);
}

export async function convertEstimateAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("estimate", "update");
  const id = String(formData.get("id") ?? "");
  let jobId: string | null = null;
  try {
    const job = await service.convertToJob(ctx, id);
    jobId = job.id;
  } catch {
    revalidatePath(`/estimates/${id}`);
    return;
  }
  redirect(`/jobs/${jobId}`);
}

// --- Public portal actions (no auth — validated by approval token) ---------

export async function portalDecisionAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";
  try {
    await service.decideByToken(token, approve);
  } catch {
    /* expired / not found — page will reflect state */
  }
  revalidatePath(`/portal/estimates/${token}`);
}
