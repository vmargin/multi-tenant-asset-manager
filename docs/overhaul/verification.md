# AssetHub verification evidence

Verification date: 7 October 2026. The supplied AssetHub image governs the visual direction. Tests use synthetic fixtures and isolated demo workspaces; they do not authenticate as an original user.

## Automated checks

| Check | Evidence |
| --- | --- |
| PostgreSQL API suite | Eight tests passed, zero failed and zero skipped with `RUN_DB_TESTS=1` |
| Password regression | The tenant/permission test passed again after adding rejection of passwords exceeding bcrypt's 72-byte limit |
| Frontend lint | `npm run lint` passed |
| Frontend production bundle | Vite built successfully: 1,919 modules, approximately 314 kB JavaScript before gzip |
| Prisma | Schema validation, client generation and migration deployment passed with the dependency override |
| Dependency audits | Backend and frontend audits reported zero vulnerabilities |
| Original data | `node scripts/migration-proof.cjs check` returned `originalRecordsPreserved: true`: two organizations, two users with unchanged credentials, two categories and five assets |
| Database schema | Prisma diff against the migrated database was empty |

The API suite exercises tenant isolation, OWNER/MANAGER/MEMBER permissions, stale tenant recovery, concurrent checkout, return dates, maintenance transitions, versioned audit updates, location cycles, atomic CSV import, one-use invitations, existing-account password preservation, last-owner protection, isolated demo workspaces, demo expiry and import-safe server initialization.

One release-check run hit the local machine's native Node memory-allocation error. The same production build passed when run directly and in isolation. The targeted API test passed with `node --test --test-isolation=none --test-name-pattern='tenant boundaries' test/api.integration.test.js`. This is recorded separately from application failures.

## Browser behavior

Playwright verified the following against the real local frontend and API:

- Create an asset, check it out to a custodian, return it, transfer it, start and resolve maintenance, and retire it. Saved history reflects each transition.
- Update audit verification and complete the audit. The API returns COMPLETED; MEMBER controls remain read-only.
- Load an asset QR image, download CSV inventory, and import an actual CSV file.
- Switch organizations and exclude foreign inventory.
- Open a signed-in invitation link, accept it, and verify the accepted MEMBER cannot add assets or complete audits.
- Mark notifications read and open the first global-search result with Enter.
- Persist dark appearance after reload.
- Open mobile navigation, trap focus, make the main content inert, and restore focus on close.

All nine operational screens were checked at a 320px viewport. Document width remained 320px; inventory tables scroll inside their containers.

## Visual and accessibility review

The dashboard was visually reviewed against the supplied reference. Ivory surfaces, forest accents, editorial serif titles, fine borders, sidebar density, compact tables and focused action dialogs implement its theme and style as separate working screens.

[Light dashboard](screenshots/dashboard-light.png) and [dark dashboard](screenshots/dashboard-dark.png) are saved with synthetic demo data.

Axe-core was injected through Playwright as a development-only verification tool, using WCAG 2 A, AA and 2.1 AA tags. Dashboard, Assets, Locations, People & access, Maintenance, Audits, Categories & tags, Reports and Settings each returned zero violations in both themes. A light table-heading contrast issue was corrected through the shared muted-text token and all nine light screens were rerun successfully.

Automated accessibility checks do not establish full conformance. Manual checks covered visible labels, modal focus, mobile focus restoration, theme persistence and responsive overflow; a complete assistive-technology audit was not performed.

## Production release

Production deployment and public-domain browser evidence will be recorded here after the source is pushed and the Vercel release reaches READY.

## Operational boundaries

Demo access expires after 24 hours; expired demo data has no automatic retention cleanup. Invitations last seven days, are one-use, and provide copyable links without email delivery. Authentication rate limiting, SSO, paid billing and hardware discovery are outside this educational application. See [deployment and rollback](deployment.md) for database preservation and deployment constraints.
