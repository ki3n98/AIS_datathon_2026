# AIS Datathon Frontend (Newspaper Edition)

Next.js site that presents the datathon topic as an interactive newspaper-style report.

## Data source flow

The app pulls from notebook source datasets in `../data/cleaned/*` via:

```bash
npm run data:build
```

That generates `frontend/data/datathon-summary.json`, which powers the UI.

## Local development

```bash
cd frontend
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deployment options

### 1) GitHub Pages (already wired)

- Workflow: `.github/workflows/deploy-frontend-pages.yml`
- Trigger: push to `openclaw` branch under `frontend/**`
- Site URL format: `https://<org-or-user>.github.io/AIS_datathon_2026/`

### 2) Vercel

- Import this repo into Vercel
- Set root directory to `frontend`
- Build command: `npm run build`
- Output directory: `out`

No server runtime is required because this app is exported as static HTML.
