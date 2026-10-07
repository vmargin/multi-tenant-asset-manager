# AssetHub product research

Research date: 7 October 2026. The user-supplied AssetHub image is the visual authority. Internet sources inform behavior and requirements, not a replacement theme. All sample organizations, people, equipment and activity are synthetic.

## Sources inspected

- [Snipe-IT product features](https://snipeitapp.com/product): tenant/company separation, permissions, dashboard activity, asset history, categories, locations, checkout/return, expected return dates, CSV import/export, QR labels and per-user light/dark themes.
- [Snipe-IT workflow overview](https://snipe-it.readme.io/docs/overview): checking equipment out to a custodian and checking it back into inventory.
- [Sortly quick-start guide](https://help.sortly.com/getting-started-with-sortly-a-quick-start-guide): structured inventory, asset details, images and bulk import templates.
- [Sortly asset tracking](https://www.sortly.com/solutions/asset-tracking-software/): equipment tracking, return and location accountability.
- [EZO location audits](https://ezo.io/ezofficeinventory/blog/location-audit/): location-scoped physical verification, progress, discrepancies and audit reports.
- [EZOfficeInventory work orders](https://www.ezofficeinventory.com/industries/work-order-software): prioritized equipment issues and a maintenance lifecycle.
- [Smartsheet asset-tracking templates](https://www.smartsheet.com/content/asset-tracking-templates): register/form examples including asset tag, model, serial, custodian/location, purchase value, warranty and notes. The app's register and import template adopt these practical fields.
- [Sortly bulk-import template flow](https://help.sortly.com/bulk-importing-new-items-folders): download a template, prepare inventory, upload, validate and explain errors. AssetHub uses atomic imports to avoid partial-success duplication.
- [Snipe-IT permissions](https://snipe-it.readme.io/docs/permissions): role-based permissions with matching UI and API enforcement.

## Required feature list and flows

| Area | Complete flow | Essential safeguards |
| --- | --- | --- |
| Access | Sign in, create an organization, explore a synthetic demo, sign out | Hashed passwords; verified identity; explicit demo disclosure |
| Organizations | Switch between organizations belonging to the signed-in user | Membership is checked server-side for every request |
| Dashboard | Current totals, utilization, activity, category distribution and attention items | All numbers derive from the selected organization's records |
| Assets | Search, filter, sort, view, add, edit and retire equipment | Tenant-scoped tags/serials; validated category/location; preserve history |
| Checkout | Assign available equipment, set return date, add notes, return it | Atomic transition; one open checkout; active same-tenant recipient |
| Transfer | Move an asset between locations | Same-tenant destination and activity entry |
| Import/export | Download a CSV template, import validated rows, export selected inventory | Atomic import; duplicate handling; formula-safe export |
| Categories | View, add and edit categories | Same-tenant ownership and unique names |
| Locations | View hierarchy, add and edit locations | Same-tenant parent and no cycles |
| People | Invite members, copy an invitation link, accept an invitation, manage roles | Owner-only access changes; cannot remove the last owner |
| Requests | Report an issue; move open requests into progress; resolve repairs | Explicit states; return assigned equipment before repair |
| Audits | Start a location audit, verify equipment, finish after every item is verified | Fixed asset snapshot; server validates verification progress |
| Reports | Inventory, lifecycle, utilization, costs and export | Actual inventory values; no invented history or decorative metrics |
| Notifications | Read/filter activity notifications, mark read and open the related asset | Tenant-specific read markers; notifications reflect saved activity |
| Settings | Organization name/description/currency, appearance and access information | Owner-only organization settings; persisted accessible theme |

## Scope choices

This is a complete educational asset-management application, not a claim of enterprise compliance. Paid billing, automatic procurement, SSO/SCIM, email delivery, hardware discovery, native mobile applications and third-party integrations are outside this overhaul. Invitation links work without pretending that an email was sent. Searchable inventory and printable labels cover this browser application's equipment-identification flow.

## Template and information architecture

The image dictates the public root page's full hero-and-collage composition. Its overlapping panels preview the organization switcher, dashboard, notifications, asset register, asset details, checkout, maintenance, categories, locations, people, audits, reports, and settings. Each preview corresponds to a real operational page or drawer. Web research informs the features and safeguards in the table above; it does not replace the image's visual direction.
