"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import { roundCents } from "@/server/lib/money";
import * as service from "./inventory.service";

export interface FormState {
  error?: string;
}

const createSchema = z.object({
  sku: z.string().min(1, "กรอกรหัส SKU"),
  name: z.string().min(1, "กรอกชื่อ"),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  qtyOnHand: z.coerce.number().min(0).default(0),
  reorderPoint: z.coerce.number().min(0).default(0),
});

export async function createPartAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("inventory", "create");
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" };
  }
  try {
    await service.createPart(ctx, {
      sku: parsed.data.sku,
      name: parsed.data.name,
      costCents: roundCents(parsed.data.cost * 100),
      priceCents: roundCents(parsed.data.price * 100),
      qtyOnHand: parsed.data.qtyOnHand,
      reorderPoint: parsed.data.reorderPoint,
    });
  } catch {
    return { error: "บันทึกไม่ได้ — รหัส SKU อาจซ้ำ" };
  }
  revalidatePath("/inventory");
  redirect("/inventory");
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "กรอกชื่อ"),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  reorderPoint: z.coerce.number().min(0).default(0),
});

export async function updatePartAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("inventory", "update");
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" };
  }
  await service.updatePart(ctx, parsed.data.id, {
    name: parsed.data.name,
    costCents: roundCents(parsed.data.cost * 100),
    priceCents: roundCents(parsed.data.price * 100),
    reorderPoint: parsed.data.reorderPoint,
  });
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function adjustStockAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("inventory", "update");
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (Number.isFinite(delta) && delta !== 0) {
    await service.adjustStock(ctx, id, delta);
  }
  revalidatePath("/inventory");
}
