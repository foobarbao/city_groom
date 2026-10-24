# @city-groom/api-client

TypeScript types generated from the backend OpenAPI schema, shared by the
customer app and the partner portal (ADR-0003). Frontend API types are never
written by hand.

## Regenerating

After any backend API change, from the repository root:

```bash
npm run generate -w packages/api-client
```

This exports the schema with drf-spectacular to `openapi.yaml`, then generates
`src/schema.d.ts` with openapi-typescript. Both files are committed, so a
backend change and its effect on the frontends are reviewed together.
