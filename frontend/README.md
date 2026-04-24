# AIS Datathon Frontend (`openclaw` branch)

Hybrid editorial analytics experience:

- `/` → newspaper-style feature homepage
- `/dashboard` → full interactive analytics workspace
- `/methodology` → sources + caveats

## Data pipeline (single source of truth)

This frontend uses a **pre-generated JSON artifact** at runtime:

- Generator: `scripts/generate-dashboard-data.ts`
- Output: `data/dashboard-data.json`
- Upstream inputs: `../data/cleaned/*.csv`

Build/dev automatically regenerate the JSON before rendering.

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

### Vercel (recommended)
- Branch: `openclaw`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `out`

### GitHub Pages
- Uses static export (`output: "export"`)
- Workflow: `.github/workflows/deploy-frontend-pages.yml`
- Trigger branch: `openclaw`

### Team preview (quick share)
- Run local server and expose via your existing ngrok/tunnel setup.

## Notes

- Keep website work on `openclaw` branch only.
- Dashboard and editorial homepage share the same generated data model.
