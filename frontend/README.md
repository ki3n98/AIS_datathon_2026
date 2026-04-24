# AIS Datathon Frontend (`openclaw` branch)

Hybrid editorial + research product:

- `/` → newspaper-style feature homepage
- `/dashboard` → interactive research desk
- `/methodology` → sources + caveats

## Data pipeline (single source of truth)

Runtime reads one generated artifact:

- generator: `scripts/generate-dashboard-data.ts`
- output: `data/dashboard-data.json`
- upstream inputs: `../data/cleaned/*.csv`

`predev` and `prebuild` regenerate the JSON automatically.

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

## Deployment (Vercel only for openclaw)

Use Vercel for branch deployment and sharing:

- branch: `openclaw`
- root directory: `frontend`
- build command: `npm run build`
- output directory: `out`

## Notes

- Keep website work on `openclaw` branch only.
- Dashboard and editorial homepage use the same generated data model.
