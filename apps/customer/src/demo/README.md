# Demo data

`fixtures.json` holds **fictitious** data used by the standalone demo build
(`npm run build:demo -w apps/customer`), which runs without a backend so the
app can be shown as a single web page.

- It was produced by the backend simulation: `seed_simulated_lockers` with
  fictitious positions around the centre of Grenoble, then the public API
  responses (`/api/v1/lockers/`, each locker front, `/api/v1/lockers/sizes/`)
  saved as JSON.
- Locker names start with "Démo" and positions are not real places.
- It is only bundled when `VITE_DEMO=true` (see `src/api/lockers.ts`).

Regenerate it after any change to the public locker API so the demo keeps the
real response format.
