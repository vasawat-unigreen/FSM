"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/lib/auth";
import { roundCents } from "@/server/lib/money";
import * as service from "./invoice.service";

export interface FormState {
  error?: string;
  ok?: boolean;
}

// Create an invoice from a completed job, then go to it.
export async function createInvoiceFromJobAction(
  formData: FormData,
): Promise<void> {
  const ctx = await requirePermission("invoice", "create");
  const workOrderId = String(formData.get("workOrderId") ?? "");
  let invoiceId: string;
  try {
    const invoice = await service.createInvoiceFromJob(ctx, workOrderId);
    invoiceId = invoice.id;
  } catch (err) {
    // Surface the reason on the job page via its own revalidation.
    revalidatePath(`/jobs/${workOrderId}`);
    if (err instanceof service.InvoiceError) return;
    throw err;
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
}

export async function sendInvoiceAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("invoice", "update");
  const id = String(formData.get("id") ?? "");
  try {
    await service.sendInvoice(ctx, id);
  } catch {
    /* revalidate reflects true state */
  }
  revalidatePath(`/invoices/${id}`);
}

export async function voidInvoiceAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission("invoice", "update");
  const id = String(formData.get("id") ?? "");
  try {
    await service.voidInvoice(ctx, id);
  } catch {
    /* ignore */
  }
  revalidatePath(`/invoices/${id}`);
}

const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  method: z.enum(["CARD", "CASH", "CHECK", "ACH", "OTHER"]).default("CASH"),
});

export async function recordPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await requirePermission("payment", "create");
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: z.flattenError(parsed.error).formErrors[0] ?? "ข้อมูลไม่ถูกต้อง",
    };
  }
  try {
    await service.recordPayment(
      ctx,
      parsed.data.invoiceId,
      roundCents(parsed.data.amount * 100),
      parsed.data.method,
    );
  } catch (err) {
    if (err instanceof service.InvoiceError) return { error: err.message };
    throw err;
  }
  revalidatePath(`/invoices/${parsed.data.invoiceId}`);
  return { ok: true };
}
