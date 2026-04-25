# Render Deployment Guide

End-to-end walkthrough for deploying `tredence-backend` to Render's free web service tier.

Stack: **Neon (Postgres)** + **Render (container host)** + **GitHub Actions (CI/CD)**

---

## Prerequisites

Before you start, make sure you have:

- [ ] A **GitHub account** — the repo will live here
- [ ] A **Neon account** — see `neon-setup.md` for database setup
- [ ] A **Render account** — sign up at https://render.com (free, no credit card)
- [ ] Your two Neon connection strings ready (pooled + direct)
- [ ] Docker installed locally (to verify the image builds before pushing)

---

## Phase 1 — Push the repo to GitHub

### 1.1 Create a new GitHub repository

Go to https://github.com/new and create an empty repo named `tredence-backend`.
Do **not** add a README or .gitignore (the repo already has them).

### 1.2 Add the remote and push

```bash
# Run these from inside the backend/ directory
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/tredence-backend.git
git push -u origin main
```

**What to verify:**  
Open `https://github.com/YOUR_GITHUB_USERNAME/tredence-backend` — you should see all
your files. The Actions tab should show the CI workflow starting automatically.

**If you see an auth error:**  
GitHub no longer accepts password auth for git push. Use a Personal Access Token (PAT)
or set up SSH keys. Create a PAT at: GitHub → Settings → Developer settings →
Personal access tokens → Tokens (classic) → Generate new token (check `repo` scope).
Use the token as your password.

---

## Phase 2 — Make the ghcr.io package public

After the first successful deploy run, GitHub creates a private package at
`ghcr.io/YOUR_GITHUB_USERNAME/tredence-backend`. Render's free tier can pull
**public** images without credentials.

### 2.1 Find the package

Go to `https://github.com/YOUR_GITHUB_USERNAME?tab=packages`.

### 2.2 Make it public

1. Click on `tredence-backend`.
2. Click **Package settings** (bottom-right).
3. Scroll to **Danger Zone** → **Change visibility** → **Public**.
4. Type the package name to confirm.

**What to verify:**  
You can now run `docker pull ghcr.io/YOUR_GITHUB_USERNAME/tredence-backend:latest`
from any machine without logging in.

---

## Phase 3 — Deploy to Render

### 3.1 Copy render.yaml to the repo root

Render's Blueprint auto-detection requires the file at the repo root:

```bash
cp infra/render/render.yaml render.yaml
```

Edit `render.yaml` and replace the placeholder image URL:
```yaml
url: ghcr.io/YOUR_GITHUB_USERNAME/tredence-backend:latest
```

Commit and push:
```bash
git add render.yaml
git commit -m "chore: add render.yaml at repo root"
git push
```

### 3.2 Create the Render service via Blueprint

1. Go to **https://dashboard.render.com** → **New** → **Blueprint**.
2. Connect your GitHub account if not already connected.
3. Select the `tredence-backend` repository.
4. Render finds `render.yaml` at the root and shows a preview of the service.
5. Click **Apply**.

Render creates the service but will not yet deploy (the image URL has a placeholder
and env vars aren't set). That's fine — continue to the next step.

### 3.3 Set environment variables in Render

Go to: Render Dashboard → `tredence-backend` → **Environment**

Add these variables (click **Add Environment Variable** for each):

| Key | Value | Source |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://USER:PASS@HOST-pooler.REGION.aws.neon.tech/tredence?sslmode=require` | Neon Console → pooled URL |
| `ALEMBIC_DATABASE_URL` | `postgresql+asyncpg://USER:PASS@HOST.REGION.aws.neon.tech/tredence?sslmode=require` | Neon Console → direct URL |
| `CORS_ORIGINS` | `https://tredence-backend.onrender.com` | Your Render service URL |

Click **Save Changes**.

**What to verify:**  
After saving, the values should show as `***` (masked). If they show in plain text,
you may have accidentally used the wrong field type.

### 3.4 Get the Render deploy hook URL

1. Render Dashboard → your service → **Settings** → scroll to **Deploy Hook**.
2. Click **Generate** (or copy the existing URL).
3. Copy the URL — it looks like:
   ```
   https://api.render.com/deploy/srv-xxx?key=yyy
   ```

This URL triggers a deploy when called with `POST`. Keep it secret.

---

## Phase 4 — Configure GitHub Secrets

GitHub Actions needs the deploy hook URL to trigger Render after each push.

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. Name: `RENDER_DEPLOY_HOOK_URL`
4. Value: paste the Render deploy hook URL from Phase 3.4.
5. Click **Add secret**.

**What to verify:**  
The secret appears in the list as `RENDER_DEPLOY_HOOK_URL` with the value masked.

---

## Phase 5 — Trigger the first real deploy

Push any commit to `main` to kick off the full pipeline:

```bash
git commit --allow-empty -m "chore: trigger first deploy"
git push
```

### What happens next (in order)

1. **CI workflow starts** (GitHub Actions → Actions tab):
   - `lint` job runs `ruff check` and `ruff format --check`
   - `typecheck` job runs `mypy --strict app/`
   - `test` job spins up Postgres 16, runs `alembic upgrade head`, then `pytest`
   - All three jobs run in **parallel** (~2-3 minutes total on a warm runner)

2. **Deploy workflow starts** (only if CI passes on `main`):
   - Builds the Docker image
   - Pushes `ghcr.io/YOUR_USERNAME/tredence-backend:latest` and `:sha-<hash>`
   - Calls the Render deploy hook

3. **Render deploys**:
   - Pulls the new image from ghcr.io
   - Starts the container → `docker-entrypoint.sh` runs:
     - Waits for Neon to be reachable (max 30s)
     - Runs `alembic upgrade head` (creates tables on first deploy)
     - Starts gunicorn with uvicorn workers
   - Render pings `GET /health` — if it returns 200, deploy succeeds

**What to verify:**  
- GitHub Actions → both CI and Deploy workflows show green checkmarks
- Render Dashboard → your service shows **Deploy succeeded**
- Visit `https://tredence-backend.onrender.com/health` — you should see:
  ```json
  {"status": "ok", "database": "ok"}
  ```
- Visit `https://tredence-backend.onrender.com/docs` — FastAPI's interactive API docs

---

## Known free-tier behaviours

### Render spin-down
Free web services spin down after **15 minutes of inactivity**. The next request
triggers a cold start (~20-30s while gunicorn starts). During cold start, Render
re-runs `alembic upgrade head` — this is intentional and idempotent.

To avoid the spin-down delay in demos, ping `/health` before presenting.

### Neon auto-suspend
Neon pauses its compute after **5 minutes of inactivity** (free tier). The first
query after a pause takes ~500ms to wake the database. The `/health` endpoint's
`SELECT 1` wakes Neon if it was suspended.

### Combined cold start
If both Render and Neon are cold at the same time, the first request may take
~3-5 seconds. Subsequent requests are fast (<100ms).

---

## Troubleshooting

### Deploy fails: "image not found"
The ghcr.io package doesn't exist yet or is still private. Check Phase 2.

### Deploy fails: "health check failed"
- Check Render logs → your service → **Logs**
- Common causes:
  - `DATABASE_URL` not set or has a typo
  - Neon project is paused (log into Neon, check the Console)
  - `alembic upgrade head` failed (migration error — check the logs)

### CI fails: "modulenotfounderror"
Run `pip install -e ".[dev]"` locally and make sure it succeeds.
The `pyproject.toml` `[project.dependencies]` section controls what CI installs.

### Tests fail in CI but pass locally
Check that `DATABASE_URL` in your `.env` and the CI env match. The CI test DB
is `tredence_test`, not `tredence`.

### Render deploy hook returns non-2xx
The hook URL may have expired (this happens if you regenerate it). Get a fresh URL
from Render → Settings → Deploy Hook, and update the GitHub secret.
