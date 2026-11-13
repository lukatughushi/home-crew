# HomeCrew

Home services platform: React + Vite + TypeScript + Tailwind (frontend) and Express + TypeScript (backend).

## Run locally

```bash
npm run install:all   # first time only
npm run dev           # frontend http://localhost:3000, API http://localhost:5000
```

Or run them separately: `npm run dev:backend` and `npm run dev:frontend`.

The frontend calls `/api/*`, which Vite proxies to the backend on port 5000, so there is no CORS setup to do in dev.

## Design assets

See `frontend/src/assets/design-specs/README.md`.
