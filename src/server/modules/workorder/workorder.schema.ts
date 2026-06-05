import { z } from "zod";

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

const JOB_TYPE = [
  "INSTALL",
  "REPAIR",
  "MAINTENANCE",
  "INSPECTION",
  "EMERGENCY",
] as const;

const JOB_PRIORITY = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

const optionalString = z.string().trim().optional().or(z.literal(""));

export const createWorkOrderSchema = z.object({
  customerId: z.string().uuid("Pick a customer"),
  siteId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(JOB_TYPE).default("REPAIR"),
  priority: z.enum(JOB_PRIORITY).default("NORMAL"),
  summary: z.string().min(3, "Summary is required"),
  description: optionalString,
  assignedTechId: z.string().uuid().optional().or(z.literal("")),
});

export const updateWorkOrderSchema = z.object({
  type: z.enum(JOB_TYPE),
  priority: z.enum(JOB_PRIORITY),
  summary: z.string().min(3, "Summary is required"),
  description: optionalString,
  siteId: z.string().uuid().optional().or(z.literal("")),
  scheduledStart: optionalString,
  scheduledEnd: optionalString,
});

export const statusSchema = z.object({
  id: z.string().uuid(),
  to: z.enum(JOB_STATUS),
});

export const assignSchema = z.object({
  id: z.string().uuid(),
  assignedTechId: z.string().uuid().optional().or(z.literal("")),
});

export const lineItemSchema = z.object({
  workOrderId: z.string().uuid(),
  type: z.enum(["LABOR", "PART", "FEE", "DISCOUNT"]).default("LABOR"),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be > 0").default(1),
  // Entered in dollars in the UI; converted to integer cents in the action.
  unitPrice: z.coerce.number().min(0, "Price must be ≥ 0").default(0),
});

export const noteSchema = z.object({
  workOrderId: z.string().uuid(),
  body: z.string().min(1, "Note cannot be empty"),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
