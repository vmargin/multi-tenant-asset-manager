# AssetHub verification evidence

Verification date: 7 October 2026. The supplied AssetHub image governs the visual direction. Tests use synthetic fixtures and isolated demo workspaces; they do not authenticate as an original user.

## Automated checks

| Check | Evidence |
| --- | --- |
| PostgreSQL API suite | The complete overhaul suite passed eight tests, zero failed and zero skipped with `RUN_DB_TESTS=1`; subsequent scoped regressions are listed below |
| Password regression | The tenant/permission test passed again after adding rejection of passwords exceeding bcrypt's 72-byte limit |
| Demo release regression | Demo isolation/expiry and tenant/permission tests passed after batching demo writes; assertions cover category/location links, assignees, open checkouts and location-scoped audit snapshots |
| Custody history regression | The concurrent-checkout/date test passed after changing new history entries to use the custodian's name |
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

[Light dashboard](screenshots/dashboard-light.png), [dark dashboard](screenshots/dashboard-dark.png), [asset register](screenshots/assets-light.png), [checkout drawer](screenshots/checkout-light.png) and [320px dashboard](screenshots/dashboard-mobile.png) are captured from production with synthetic demo data.

Axe-core was injected through Playwright as a development-only verification tool, using WCAG 2 A, AA and 2.1 AA tags. Dashboard, Assets, Locations, People & access, Maintenance, Audits, Categories & tags, Reports and Settings each returned zero violations in both themes. A light table-heading contrast issue was corrected through the shared muted-text token and all nine light screens were rerun successfully.

Automated accessibility checks do not establish full conformance. Manual checks covered visible labels, modal focus, mobile focus restoration, theme persistence and responsive overflow; a complete assistive-technology audit was not performed.

## Production release

Public domain: [multi-tenant-asset-manager.vercel.app](https://multi-tenant-asset-manager.vercel.app/). GitHub source: [vmargin/multi-tenant-asset-manager](https://github.com/vmargin/multi-tenant-asset-manager).

The initial overhaul deployment reached READY and returned HTTP 200 for the public HTML and health endpoint. Its first live demo request exposed a Prisma P2028 transaction timeout: setup inserted each synthetic record separately. Demo provisioning now preassigns IDs and inserts each table in batches inside the same all-or-nothing transaction. The transaction deadline and isolation safeguards remain in place.

The corrected backend release `88e7c32` reached READY as `dpl_6YH6zqeQwrWGDN3PPCjNpcw4qu1g`. The compact-toolbar release `8146f55` reached READY as `dpl_9vYjZbaor2LePim6pd5quqrQrVee`. Both were promoted automatically from GitHub main to the public production domain. Browser proof includes:

- Public HTML and `/api/health` returned HTTP 200 and the expected AssetHub/ok content.
- The corrected live demo returned HTTP 201 and opened the dashboard. One cold run took approximately 19 seconds from clicking Explore to the loaded dashboard; this is a single observed run, not a latency benchmark.
- Both synthetic workspaces returned HTTP 200 with 23 initial asset records each. Their IDs were disjoint and every asset matched its selected organization. A non-member organization request returned HTTP 403.
- An asset created through the UI returned 201; checkout returned 201; return and retirement returned 200. Saved data confirmed RETIRED, a closed checkout and all four lifecycle activity entries.
- A copyable invitation returned 201, remained INVITED, and used the stable `https://multi-tenant-asset-manager.vercel.app` origin. No email was sent.
- A QR label returned 200 and its 256px image loaded.
- Dark appearance persisted after reload. All nine operational screens returned zero automated accessibility violations in both themes after the toolbar correction. The settled checkout drawer also returned zero violations.
- All nine screens retained a 320px document width on a 320px viewport. Mobile navigation made main content inert and restored focus to Open navigation after Escape.
- Asset filters measured 38px high on desktop and 44px on mobile. Import retained a visible keyboard focus outline while the native file control was visually integrated into the button.
- The corrected backend's deployment-scoped runtime logs returned no error, warning or fatal entries during the observed test window. The intentional 403 membership probe was expected; it is not an application failure.

The original-data fingerprint proof was rerun after production mutations and still preserved all original records and credentials. The final evidence update also makes new custody-history descriptions use the person's name rather than an internal identifier. Its checkout concurrency regression passed; the protected database is not rewritten to change older history text.

## Operational boundaries

Demo access expires after 24 hours; expired demo data has no automatic retention cleanup. Invitations last seven days, are one-use, and provide copyable links without email delivery. Authentication rate limiting, SSO, paid billing and hardware discovery are outside this educational application. See [deployment and rollback](deployment.md) for database preservation and deployment constraints.
