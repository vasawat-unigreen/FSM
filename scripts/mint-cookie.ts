import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { signSession } from "../src/server/lib/session-token";

// Dev helper: print a valid session cookie for a seeded user so the
// authenticated pages can be smoke-tested with curl.
async function main() {
  const email = process.argv[2] ?? "owner@acme.test";
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error(`No user ${email}`);

  const token = await signSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });
  console.log(token);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
