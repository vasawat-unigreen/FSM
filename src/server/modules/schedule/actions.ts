"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import * as service from "./schedule.service";

export interface FormState {
  error?: string;
  ok?: boolean;
}

const scheduleSchema = z.object({
  workOrderId: z.string().uuid(),
  technicianId: z.string().uuid("เลือกช่าง"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง"),
  durationMin: z.coerce.number().int().positive().default(60),
});

export async function scheduleJobAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("schedule", "create");
  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { workOrderId, technicianId, date, startTime, durationMin } =
    parsed.data;
  const startAt = new Date(`${date}T${startTime}:00.000Z`);
  const endAt = new Date(startAt.getTime() + durationMin * 60_000);

  try {
    await service.createAppointment(ctx, {
      workOrderId,
      technicianId,
      startAt,
      endAt,
    });
  } catch (err) {
    if (err instanceof service.ConflictError) {
      return { error: "ช่วงเวลานี้ทับซ้อนกับนัดหมายอื่น" };
    }
    return { error: "ไม่สามารถจัดตารางได้" };
  }

  revalidatePath("/schedule");
  return { ok: true };
}

const moveSchema = z.object({
  id: z.string().uuid(),
  technicianId: z.string().uuid(),
});

export async function moveAppointmentAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("schedule", "update");
  const parsed = moveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  try {
    await service.moveAppointment(ctx, parsed.data.id, {
      technicianId: parsed.data.technicianId,
    });
  } catch {
    // Conflict / not found: leave as-is; revalidate reflects true state.
  }
  revalidatePath("/schedule");
}

export async function deleteAppointmentAction(
  formData: FormData,
): Promise<void> {
  const ctx = await requirePermission("schedule", "update");
  await service.deleteAppointment(ctx, String(formData.get("id") ?? ""));
  revalidatePath("/schedule");
}
