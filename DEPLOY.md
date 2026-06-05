# Deploying to Netlify

This app runs on Netlify's Next.js runtime. Two things differ from local dev:
a **hosted Postgres** (instead of the embedded one) and **Netlify Blobs** for
uploaded photos/signatures (Netlify's filesystem is ephemeral).

## 1. Create a Postgres database (Neon)

1. Sign up at <https://neon.tech> and create a project (region close to your
   Netlify site).
2. Copy the **pooled** connection string — the host contains `-pooler`, e.g.
   `postgresql://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require`.
   Pooling is important on serverless so connections aren't exhausted.

> Any hosted Postgres works (Supabase, RDS, …). Prefer a pooled endpoint.

## 2. Push the schema to the database (one time)

From your machine, point Prisma at the production DB and create the tables:

```bash
DATABASE_URL="<neon-pooled-url>" npx prisma db push
# optional: load demo data
DATABASE_URL="<neon-pooled-url>" npm run db:seed
```

(When you later adopt migrations, use `prisma migrate deploy` instead.)

## 3. Create the Netlify site

1. Push this repo to GitHub/GitLab.
2. Netlify → **Add new site → Import from Git** → pick the repo.
3. Build settings are read from [`netlify.toml`](netlify.toml) (command
   `npm run build`, Node 22). Leave them as detected.

## 4. Set environment variables

Netlify → Site settings → **Environment variables**:

| Key | Value |
|---|---|
| `DATABASE_URL` | the Neon **pooled** URL from step 1 |
| `AUTH_SECRET` | output of `openssl rand -base64 32` |
| `STORAGE_DRIVER` | `blobs` |

> Netlify Blobs needs no keys — it's provisioned automatically for the site.

## 5. Deploy

Trigger a deploy (push to the default branch, or **Deploys → Trigger deploy**).
The build runs `prisma generate` (via `postinstall`) then `next build`.

When it's live, open the site, log in, and verify:
- creating a customer/job writes to Neon,
- uploading a field photo + signature persists (stored in Netlify Blobs),
- the day/night toggle and dropdowns render correctly.

## Notes & limits

- **Uploads**: handled by `src/server/lib/storage.ts`. With `STORAGE_DRIVER=blobs`
  files go to Netlify Blobs; locally (unset) they go to `./uploads`.
- **Connection pooling**: always use the pooled DB URL on Netlify. If you see
  "too many connections", confirm you're not using the direct (non-pooler) host.
- **First request latency**: serverless cold starts add a little latency on the
  first hit after idle — normal.
- **Secrets**: never commit real `AUTH_SECRET`/`DATABASE_URL`; they live only in
  Netlify env vars. `.env` is gitignored.
