# Deployment and rollback

Production project: multi-tenant-asset-manager on Vercel, linked to vmargin/multi-tenant-asset-manager on GitHub. Public domain: https://multi-tenant-asset-manager.vercel.app/.

## Release procedure

1. Run the build, lint, PostgreSQL tests and browser checks recorded in verification.md.
2. Review and apply the checked-in migrations using `prisma migrate deploy` from backend, with the existing database connection. Do not run a seed, reset, db push or destructive setup SQL.
3. Commit the reviewed source, fast-forward main and push without force. The Vercel install uses both lockfiles; its build validates/generates Prisma and builds Vite. Database migration is deliberately separate from the build.
4. Inspect the production deployment until READY. Verify the public HTML, health endpoint, authenticated workspace reads, demo isolation, key browser screens and theme persistence at the production domain.

The original database had tables but no Prisma migration history. The original schema was inspected before marking `20260108082121_init_tables` and `20260108083405_sync_schema_with_slug` applied. Their historical SQL was not rerun. The two October migrations preserve the original organization/user/category/asset IDs and credentials, add memberships and operational records, normalize legacy active status to AVAILABLE, and preserve maintenance as an IN_PROGRESS request. A schema diff after deployment was empty.

The ignored `.playwright-mcp/database-baseline.json` holds original record fingerprints. `node scripts/migration-proof.cjs check` compares only those original rows. It does not display account credentials.

## Rollback

Local tag `codex/asset-hub-baseline-20261007` preserves the original source at `589f411`. The additive database migration remains in place. Prefer reverting the faulty application change into a compatible forward-fix release. Do not reverse migrations by dropping new tables: they can contain new user records.

Vercel retains previous deployments, but the original application has an older status/API contract. Restoring it alone is not a complete data-compatible rollback. Review compatibility before promoting an old deployment. Never overwrite or delete protected original records to repair a release.

## Operational limits

Authentication sessions and demo access last 24 hours. Invitation links last seven days and are one-use. Demo provisioning is capped at 100 sessions per hour with a database advisory lock. This is a volume safeguard rather than a distributed authentication rate limiter. Expired demo access is denied; automatic retention cleanup is not provided. Prisma pools are bounded to two connections per instance; PostgreSQL pool capacity remains a deployment constraint. Email sending and paid infrastructure are not required.
