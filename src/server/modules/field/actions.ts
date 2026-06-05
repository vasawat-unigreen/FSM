"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import { roundCents } from "@/server/lib/money";
import { changeStatus } from "@/server/modules/workorder/workorder.service";
import type { JobStatus } from "@/generated/prisma/client";
import * as field from "./field.service";

export interface FormState {
  error?: string;
  ok?: boolean;
}

const JOB_STATUS = [
  "DRAFT",
  "SCHEDULED",
  "DISPATCHED",
  "EN_ROUTE",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "INVOICED",
  "CLOSED",
  "CANCELLED",
] as const;

function refresh(jobId: string) {
  revalidatePath(`/field/${jobId}`);
  revalidatePath("/field");
}

export async function fieldStatusAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "update");
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!z.enum(JOB_STATUS).safeParse(to).success) return;
  try {
    await field.getMyJob(ctx, id); // ownership guard
    await changeStatus(ctx, id, to as JobStatus);
  } catch {
    // invalid transition / not allowed — revalidate reflects true state
  }
  refresh(id);
}

export async function startTimerAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "update");
  const id = String(formData.get("id") ?? "");
  await field.openTimeEntry(ctx, id);
  refresh(id);
}

export async function stopTimerAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "update");
  const id = String(formData.get("id") ?? "");
  await field.closeTimeEntry(ctx, id);
  refresh(id);
}

const partSchema = z.object({
  jobId: z.string().uuid(),
  description: z.string().min(1, "กรอกชื่ออะไหล่"),
  quantity: z.coerce.number().positive().default(1),
  unitPrice: z.coerce.number().min(0).default(0),
});

export async function addPartAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "update");
  const parsed = partSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" };
  }
  await field.addPart(
    ctx,
    parsed.data.jobId,
    parsed.data.description,
    parsed.data.quantity,
    roundCents(parsed.data.unitPrice * 100),
  );
  refresh(parsed.data.jobId);
  return { ok: true };
}

export async function uploadPhotoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "update");
  const jobId = String(formData.get("jobId") ?? "");
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "ไม่พบไฟล์รูป" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "รองรับเฉพาะไฟล์รูปภาพ" };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  await field.addAttachment(ctx, jobId, bytes, file.type);
  refresh(jobId);
  return { ok: true };
}

export async function saveSignatureAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "update");
  const jobId = String(formData.get("jobId") ?? "");
  const dataUrl = String(formData.get("signature") ?? "");
  const match = /^data:(image\/png);base64,(.+)$/.exec(dataUrl);
  if (!match) return { error: "ลายเซ็นไม่ถูกต้อง" };

  const bytes = Buffer.from(match[2], "base64");
  await field.addAttachment(ctx, jobId, bytes, "image/png");
  refresh(jobId);
  return { ok: true };
}
