import { type NextRequest } from "next/server";
import { readSession } from "@/server/lib/session";
import { prisma } from "@/server/lib/db";
import { readStoredFile } from "@/server/lib/storage";

// Serves an uploaded attachment, scoped to the requester's tenant. The route
// param is the Attachment id; the bytes live on disk keyed by attachment.url.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!attachment) return new Response("Not found", { status: 404 });

  try {
    const bytes = await readStoredFile(attachment.url);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": attachment.mime ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
