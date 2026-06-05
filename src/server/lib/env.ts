import { z } from "zod";

// Validate environment at startup so misconfiguration fails fast and loud.
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  // Auth (added in Phase 1)
  AUTH_SECRET: z.string().min(16).optional(),
  // File storage backend: "disk" (default) or "blobs" (Netlify)
  STORAGE_DRIVER: z.enum(["disk", "blobs"]).optional(),
  // Integrations (added in later phases)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.treeifyError(parsed.error),
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
