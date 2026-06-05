import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

// Spins up a real, local PostgreSQL instance (no Docker / admin needed) on
// localhost:5432 matching DATABASE_URL in .env. Keep this running in the
// background while developing. Data persists in ./.pgdata.
const DATA_DIR = "./.pgdata";

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "postgres",
    port: 5432,
    persistent: true,
    // Force UTF8 so Thai text stores correctly. Without this, initdb inherits
    // the host's Thai_Thailand.1252 locale and the cluster defaults to WIN1252,
    // which cannot represent Thai characters.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

  const fresh = !existsSync(DATA_DIR);

  if (fresh) {
    console.log("Initialising new Postgres cluster…");
    await pg.initialise();
  }

  await pg.start();
  console.log("Postgres started on localhost:5432");

  if (fresh) {
    try {
      await pg.createDatabase("fsm");
      console.log('Created database "fsm"');
    } catch (err) {
      console.warn("createDatabase:", (err as Error).message);
    }
  }

  console.log("Ready. Leave this process running. Ctrl+C to stop.");

  const shutdown = async () => {
    console.log("\nStopping Postgres…");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep the event loop alive.
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
