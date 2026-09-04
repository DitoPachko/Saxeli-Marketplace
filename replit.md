# Saxeli Marketplace

Saxeli is a Georgian-first peer-to-peer marketplace for buying and selling personal items.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/saxeli-marketplace/src/` — React marketplace shell, pages, and visual theme
- `artifacts/api-server/src/routes/marketplace.ts` — listing, detail, search, and favorite endpoints
- `artifacts/api-server/src/routes/profile.ts` — profile summary and message inbox endpoints
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and schemas
- `lib/api-client-react/src/generated/` — generated React Query client

## Architecture decisions

- The first build keeps seeded listings in the API process so the marketplace is immediately usable without blocking on an external account connection.
- The UI is Georgian-first and deliberately excludes cars, real estate, and heavy household appliances from the category model.
- Unsplash image URLs provide resilient seeded listing photography while the upload flow previews user-selected images client-side.

## Product

Users can browse, search, and filter personal-item listings; open item details; save favorites; publish a listing through a guided form; view their profile dashboard and inbox; and access Georgian login and registration screens.

## User preferences

The user requested a Georgian interface, GEL pricing, and a clean neutral marketplace focused strictly on personal items.

## Gotchas

- Regenerate API clients after changing `lib/api-spec/openapi.yaml` with `pnpm --filter @workspace/api-spec run codegen`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
