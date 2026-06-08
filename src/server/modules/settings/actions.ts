"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import * as service from "./settings.service";

export interface FormState {
  error?: string;
  ok?: boolean;
}

const ROLES = [
  "OWNER",
  "ADMIN",
  "DISPATCHER",
  "TECHNICIAN",
  "ACCOUNTANT",
  "READ_ONLY",
] as const;

export async function updateTaxAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("settings", "update");
  const percent = Number(formData.get("taxPercent") ?? 0);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: "อัตราภาษีไม่ถูกต้อง" };
  }
  await service.updateTaxRate(ctx, percent / 100);
  revalidatePath("/settings");
  return { ok: true };
}

const memberSchema = z.object({
  name: z.string().min(2, "กรอกชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  role: z.enum(ROLES).default("TECHNICIAN"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});

export async function addMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("user", "create");
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" };
  }
  try {
    await service.addTeamMember(ctx, parsed.data);
  } catch {
    return { error: "เพิ่มสมาชิกไม่ได้ — อีเมลอาจซ้ำ" };
  }
  revalidatePath("/settings");
  return { ok: true };
}

export async function setRoleAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("user", "update");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!z.enum(ROLES).safeParse(role).success) return;
  try {
    await service.setRole(ctx, userId, role as (typeof ROLES)[number]);
  } catch {
    /* ignore — revalidate shows state */
  }
  revalidatePath("/settings");
}

export async function setActiveAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("user", "update");
  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  try {
    await service.setActive(ctx, userId, active);
  } catch {
    /* ignore */
  }
  revalidatePath("/settings");
}
