# AssetHub implementation blueprint and API contract

## Baseline and done

Baseline: commit `589f411`, local rollback tag `codex/asset-hub-baseline-20261007`, branch `codex/asset-hub-overhaul`. Live existing sign-in returned 200. Database read-only baseline: 2 organizations, 2 users, 5 assets, 2 categories. Existing data and IDs must survive. Do not run the old destructive seed script.

Done: researched product flows implemented in the reference's light/dark style; tenant-safe persisted backend; meaningful lifecycle and permission tests; desktop/mobile browser verification; committed and pushed to the existing repository; production READY and verified at the existing URL. No paid services are required.

## Ownership and architecture

Retain React 19/Vite and Express/Prisma/PostgreSQL because they fit the required system and existing Vercel deployment. Replace the old frontend, extend the backend coherently and use forward-only reviewed additive SQL. There is one same-origin `/api` contract in local development and production. Vercel imports the Express application; local execution binds a port only from the main module.

Authentication establishes a user. `X-Organization-Id` selects a workspace; middleware looks up its ACTIVE membership on every protected request. A signed token or client-selected organization never grants access by itself. Roles: OWNER, MANAGER, MEMBER. Owners manage people and organization settings; managers handle inventory, locations, categories, maintenance and audits; members view and report issues. No physical deletion flow: assets retire with history intact.

Database: existing Organization/User/Asset/Category stay; add Membership, Location, Checkout, MaintenanceRequest, Audit, Activity and Invitation. Add descriptive asset fields and optional tenant-safe relationships. Tenant-specific serial/tag uniqueness replaces global serial uniqueness. Atomic compare-and-set transitions protect checkout, return and repair from races; history and asset changes commit together. A partial unique index permits only one open checkout per asset. Never expose password hashes or invitation tokens in workspace reads.

## Common response shapes

All JSON errors use `{error:string}` with 400 validation, 401 invalid session, 403 denied permission, 404 missing/cross-tenant object, 409 invalid state/conflict. Dates are ISO strings. Entity status values are uppercase.

Session: `{token,user:{id,name,email},organizations:[{id,name,slug,role}],activeOrganizationId}`. `/auth/me` returns this without token. Frontend sends Authorization Bearer token and X-Organization-Id.

`GET /workspace` returns `{organization:{id,name,slug,description,currency},role,assets,categories,locations,people,requests,audits,activity,checkouts}`. All arrays are selected-tenant data.

- Asset: `{id,name,assetTag,serialNumber,status,categoryId,locationId,assignedToId,model,purchaseDate,warrantyDate,purchaseCost,notes,imageKey,createdAt}`. Status AVAILABLE / ASSIGNED / MAINTENANCE / RETIRED. assignedToId refers to Membership.id. expectedReturn can be derived from the matching open checkout.
- Category: `{id,name,description}`.
- Location: `{id,name,parentId,address}`.
- Person (membership): `{id,userId,name,email,role,department,status}`. Status ACTIVE / INVITED / SUSPENDED.
- Request: `{id,assetId,title,description,priority,status,requestedById,createdAt,updatedAt}`. Priority LOW / MEDIUM / HIGH. Status OPEN / IN_PROGRESS / RESOLVED.
- Audit: `{id,name,locationId,status,assetIds,verifiedAssetIds,version,createdAt,completedAt}`. Fixed inventory snapshot; IN_PROGRESS / COMPLETED. Every update supplies the version it read; stale writes return 409 and the UI refreshes the snapshot.
- Activity: `{id,action,title,description,assetId,createdAt}`. Append-only.
- Checkout: `{id,assetId,personId,checkoutDate,expectedReturn,returnedAt,notes}`.

## Endpoints

| Endpoint | Payload / result | Permission |
| --- | --- | --- |
| POST /auth/login | `{email,password}` -> Session | public |
| POST /auth/demo | -> Session for an isolated synthetic demo user and two workspaces | public, rate/volume limited |
| POST /auth/register | `{name,email,password,organizationName}` -> Session | public |
| POST /auth/accept-invite | `{token,name,password}` -> Session | valid one-use unexpired invitation |
| GET /auth/me | -> Session without token | signed-in |
| GET /workspace | -> workspace snapshot | active membership |
| POST /assets | asset descriptive fields (initial AVAILABLE) | manager/owner |
| PATCH /assets/:id | descriptive fields only | manager/owner |
| POST /assets/:id/checkout | `{personId,checkoutDate,expectedReturn,notes}` | manager/owner, AVAILABLE -> ASSIGNED |
| POST /assets/:id/checkin | `{notes?}` | manager/owner, ASSIGNED -> AVAILABLE |
| POST /assets/:id/transfer | `{locationId}` | manager/owner |
| POST /assets/:id/retire | `{}` | manager/owner; no open checkout/repair |
| GET /assets/:id/label | -> `{dataUrl}` QR label | active membership |
| POST /assets/import | `{assets:[asset descriptive fields]}` -> `{count}` atomic, max 250 | manager/owner |
| POST /categories | `{name,description}` | manager/owner |
| PATCH /categories/:id | `{name,description}` | manager/owner |
| POST /locations | `{name,parentId?,address?}` | manager/owner |
| PATCH /locations/:id | `{name,parentId?,address?}` | manager/owner |
| POST /people | `{name,email,role,department}` -> `{person,inviteUrl}` | owner |
| PATCH /people/:id | `{role?,department?,status?}` | owner, preserve last owner |
| POST /requests | `{assetId,title,description,priority}` | any member |
| PATCH /requests/:id | `{status}` | manager/owner; IN_PROGRESS requires asset AVAILABLE, marks MAINTENANCE; resolve releases to AVAILABLE |
| POST /audits | `{name,locationId?}` snapshots non-retired assets | manager/owner |
| PATCH /audits/:id | `{expectedVersion,verifiedAssetIds?,status?}` | manager/owner; complete requires all snapshot assets verified |
| PATCH /organization | `{name,description,currency}` | owner |
| GET /health | generic service health | public |

Demo: create a separate demo user with unguessable session identity and two sample organizations, realistic equipment, categories, locations, people, issues, audit snapshots and backdated activity. A persisted browser session reuses its authenticated workspace; public demo access never grants existing tenants. No passwordless sign-in to an existing user's organization. Demo provisioning is bounded and distinguished from normal registration. Never alter original tenants to improve visual density.

## Exact work areas

Docs/config: `docs/overhaul/`, `sauron.config.yaml`, generated `.codex/` and `.sauron/` metadata, `.gitignore`, README and deployment configuration.
Backend: `backend/prisma/schema.prisma`, one new migration directory, `backend/src/`, `backend/test/`, `backend/package.json`/lockfile. Replace destructive seed entrypoint with an additive development seed only if required.
Frontend: `frontend/src/App.jsx`, `index.css`, `main.jsx`, `api/`, `components/`, `pages/`, `lib/`, locally bundled font assets, `frontend/index.html`, package/lockfile and lint configuration.
Verification: ignored `.playwright-mcp/` and scripts under `scripts/`. Leave existing untracked user learning and résumé artifacts alone.

## Proof and regression

Baseline counts and original IDs after migration; schema validation; frontend build/lint; backend API tests with real PostgreSQL using temporary synthetic tenants. Test unauthenticated access, forged tenant header, foreign object IDs, MEMBER write denial, cross-tenant category/location/assignee, double checkout, invalid dates, maintenance transitions, audit completion, last-owner safety, atomic CSV import and invitation acceptance. Browser-check landing/access, both themes, org switch, every screen and the full asset checkout/return flow. Preserve data when provisioning fails and fail closed on backend errors.
