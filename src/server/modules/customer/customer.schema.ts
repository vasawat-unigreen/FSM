import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL"]).default("RESIDENTIAL"),
  billingAddress: z.string().trim().optional().or(z.literal("")),
  paymentTerms: z.string().default("net_30"),
});

export const contactSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.string().trim().optional().or(z.literal("")),
  isPrimary: z.coerce.boolean().default(false),
});

export const siteSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().trim().optional().or(z.literal("")),
  address: z.string().min(3, "Address is required"),
  accessNotes: z.string().trim().optional().or(z.literal("")),
  gateCode: z.string().trim().optional().or(z.literal("")),
});

export const assetSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(2, "Name is required"),
  make: z.string().trim().optional().or(z.literal("")),
  model: z.string().trim().optional().or(z.literal("")),
  serial: z.string().trim().optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SiteInput = z.infer<typeof siteSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
