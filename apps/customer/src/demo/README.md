# Demo mode

In the demo builds (`build:demo`, `build:demo-site`), `VITE_DEMO=true` and
the app runs without a backend:

- `demoApi.ts` answers the API calls from the shared demo dataset
  [`@city-groom/demo-data`](../../../../packages/demo-data/README.md): simulated
  lockers at real tram stops, real businesses from OpenStreetMap;
- `offlineMap.ts` serves an embedded map extract in the single-page demo
  (`VITE_OFFLINE_MAP=true`), whose page cannot load external resources.
