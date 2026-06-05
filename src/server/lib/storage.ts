import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

// Pluggable file storage for uploads (photos, signatures).
//   - dev / self-host:  local disk under ./uploads      (STORAGE_DRIVER unset)
//   - Netlify (prod):   Netlify Blobs                    (STORAGE_DRIVER=blobs)
// The serving route and field service call these regardless of backend.
const DRIVER = process.env.STORAGE_DRIVER ?? "disk";
const UPLOAD_DIR = join(process.cwd(), "uploads");
const BLOB_STORE = "uploads";

function assertId(id: string) {
  // Keys are UUIDs only — blocks path traversal on the disk backend.
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid file id");
}

async function blobStore() {
  // Imported lazily so the SDK (and its Netlify context) is only required when
  // the blobs backend is actually selected.
  const { getStore } = await import("@netlify/blobs");
  return getStore(BLOB_STORE);
}

export async function saveFile(bytes: Buffer): Promise<string> {
  const id = randomUUID();

  if (DRIVER === "blobs") {
    const store = await blobStore();
    await store.set(
      id,
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    );
    return id;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, id), bytes);
  return id;
}

export async function readStoredFile(id: string): Promise<Buffer> {
  assertId(id);

  if (DRIVER === "blobs") {
    const store = await blobStore();
    const data = (await store.get(id, { type: "arrayBuffer" })) as
      | ArrayBuffer
      | null;
    if (!data) throw new Error("File not found");
    return Buffer.from(data);
  }

  return readFile(join(UPLOAD_DIR, id));
}
