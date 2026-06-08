"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import * as service from "./contract.service";

export interface FormState {
  error?: string;
  generated?: number;
}

const createSchema = z.object({
  customerId: z.string().uuid("เลือกลูกค้า"),
  name: z.string().min(2, "กรอกชื่อสัญญา"),
  frequency: z
    .enum(["WEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL", "CUSTOM"])
    .default("MONTHLY"),
  nextRunAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "เลือกวันที่"),
});

export async function createContractAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("job", "create");
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" };
  }
  await service.createContract(ctx, {
    customerId: parsed.data.customerId,
    name: parsed.data.name,
    frequency: parsed.data.frequency,
    nextRunAt: new Date(`${parsed.data.nextRunAt}T00:00:00.000Z`),
  });
  revalidatePath("/contracts");
  return {};
}

export async function toggleContractAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("job", "update");
  await service.toggleContract(ctx, String(formData.get("id") ?? ""));
  revalidatePath("/contracts");
}

export async function generateDueAction(): Promise<void> {
  const ctx = await requirePermission("job", "create");
  await service.generateDueJobs(ctx);
  revalidatePath("/contracts");
  revalidatePath("/jobs");
}
