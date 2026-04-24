# AIS Datathon Frontend (OpenClaw branch)

This is the **newspaper-style** Next.js frontend, rebuilt using the analytics dashboard data model and wrapped in an editorial landing page.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment / sharing options

### 1) Vercel (recommended)
- Import repo
- Branch: `openclaw`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `out`

### 2) GitHub Pages (optional)
- Workflow: `.github/workflows/deploy-frontend-pages.yml`
- Trigger: push to `openclaw` under `frontend/**`
- Ensure repo Settings → Pages uses **GitHub Actions**

### 3) Local share with tunnel (fast team demo)
- Run locally: `npm run dev -- --hostname 0.0.0.0 --port 8117`
- Share via your existing ngrok tunnel or local site supervisor setup

## Notes
- Data is loaded from `../data/cleaned/*.csv` via `frontend/lib/dashboard-data.ts`.
- Keep all website work on `openclaw` branch.
