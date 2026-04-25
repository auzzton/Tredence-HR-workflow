# Neon Database Setup

Neon is a serverless Postgres provider with a permanently-free tier (no credit card,
no expiration). This guide gets you from zero to two connection strings.

---

## Step 1 — Create a Neon account

1. Go to **https://neon.tech** and click **Sign up**.
2. Use your GitHub account (fastest) or create an email account.
3. After sign-up you land on the **Console** dashboard.

---

## Step 2 — Create a project

1. Click **New Project**.
2. Give it a name, e.g. `tredence`.
3. Choose a **Region** closest to your Render service region.
   - If you picked `oregon` in `render.yaml` → choose **US West (Oregon)**.
4. Leave the Postgres version as the default (16+).
5. Click **Create project**.

Neon creates a default database named `neondb` and a default role named after your email.
You'll use a custom database name instead.

---

## Step 3 — Create the application database

In the Neon Console sidebar:

1. Click **Databases** → **New Database**.
2. Name it `tredence`.
3. Owner: leave as the default role Neon created for you.
4. Click **Create**.

---

## Step 4 — Get your connection strings

Neon gives you two kinds of strings per project. You need **both**.

### How to find them

1. In the Console sidebar, click **Dashboard** (the project overview).
2. Click the **Connection string** dropdown.
3. Select your database: `tredence`.
4. You'll see a connection string that looks like:
   ```
   postgresql://USER:PASSWORD@ep-cool-darkness-12345.us-west-2.aws.neon.tech/tredence?sslmode=require
   ```

### String A — Pooled (for the app at runtime)

Toggle **Connection pooling: ON** (the toggle near the top of the connection string panel).

The hostname changes to include `-pooler`:
```
postgresql://USER:PASSWORD@ep-cool-darkness-12345-pooler.us-west-2.aws.neon.tech/tredence?sslmode=require
```

**Adapt it for asyncpg** by changing the scheme:
```
postgresql+asyncpg://USER:PASSWORD@ep-cool-darkness-12345-pooler.us-west-2.aws.neon.tech/tredence?sslmode=require
```

This is your **`DATABASE_URL`**.

> **Why pooled?** Each Render request potentially opens a new connection. Neon's
> built-in pgbouncer proxy reuses connections, avoiding the overhead of creating
> thousands of raw Postgres connections.

### String B — Direct (for Alembic migrations)

Toggle **Connection pooling: OFF**.

The hostname is the direct endpoint (no `-pooler`):
```
postgresql://USER:PASSWORD@ep-cool-darkness-12345.us-west-2.aws.neon.tech/tredence?sslmode=require
```

Adapt for asyncpg:
```
postgresql+asyncpg://USER:PASSWORD@ep-cool-darkness-12345.us-west-2.aws.neon.tech/tredence?sslmode=require
```

This is your **`ALEMBIC_DATABASE_URL`**.

> **Why direct?** Neon's pgbouncer uses "transaction pooling" mode, which
> doesn't support DDL statements inside explicit transactions. Alembic wraps
> migrations in transactions by default, so it must bypass the proxy.

---

## Step 5 — Test connectivity (optional but recommended)

With `psql` installed locally:
```bash
psql "postgresql+asyncpg://..." # won't work with psql — use postgresql:// instead
psql "postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/tredence?sslmode=require"
```

You should see a `tredence=#` prompt. Type `\q` to exit.

If you get `connection refused`, check:
- The hostname is exact (copy-paste from the Neon console)
- `sslmode=require` is present
- Your password is URL-encoded if it contains special chars (`@`, `#`, etc.)

---

## Step 6 — Save the strings

You'll paste them into two places:
1. **Render Dashboard** → your service → **Environment** (for production)
2. A local `.env` file (never commit this) for running locally outside Docker

Your `.env` (based on `.env.example`):
```dotenv
DATABASE_URL=postgresql+asyncpg://USER:PASS@ep-xxx-pooler.region.aws.neon.tech/tredence?sslmode=require
ALEMBIC_DATABASE_URL=postgresql+asyncpg://USER:PASS@ep-xxx.region.aws.neon.tech/tredence?sslmode=require
```

---

## Neon free tier limits (as of 2025)

| Resource | Free allowance |
|---|---|
| Compute | 191.9 compute-hours/month |
| Storage | 0.5 GB |
| Projects | 1 |
| Branches | 10 |
| Auto-suspend | After 5 min inactivity (cold start ~500 ms) |

The free tier does **not** expire. You won't be charged unless you upgrade.

> **Neon cold start + Render cold start**: both services have inactivity-based
> cold starts on free tiers. First request after idle may take 2-3 seconds.
> This is normal and expected for a free portfolio deployment.
