# AssetHub design specification

## Visual authority

The user-supplied image is the absolute visual authority. The public root page reproduces its full composition: the AssetHub wordmark and separator at upper left, oversized two-line editorial headline, short description, lifecycle labels, and overlapping previews for the dashboard, organization switcher, notifications, assets, asset details, checkout, maintenance, categories, locations, people, audits, reports, and settings. Keep the first view framed to the reference's 1672 × 936 desktop proportions.

Each collage tile is illustrative and uses synthetic sample data; it corresponds to a real page or drawer in the authenticated app. Visiting `/` shows this composition even when a valid session is saved. The workspace remains one click away, and its individual screens remain readable and operable. On small screens the collage reflows into a short, overflow-safe preview instead of retaining desktop overlap. Web research governs the feature set and safeguards only; it does not choose the visual design. The design-engineering surface mode is **Operate**; the access page is **Persuade**.

## Tokens extracted from the reference

| Token | Light | Dark |
| --- | --- | --- |
| Canvas | `#f4f3ee` | `#171f1d` |
| Surface | `#fbfaf6` | `#202a26` |
| Secondary surface | `#f0efe8` | `#27332d` |
| Text | `#23342d` | `#e8ece4` |
| Muted text | `#59675e` | `#acb9ad` |
| Border | `#e0e3d9` | `#39463d` |
| Action | `#315e4d` | `#a7c6aa` |
| Action text | `#ffffff` | `#19261e` |
| Selected navigation | `#e4ebe0` | `#34463a` |

Colors are implementation interpretations of the supplied raster, not claims of exact original source values. Check rendered contrast; body text must meet 4.5:1 and large text 3:1. Status uses both a text label and color.

Typography: a locally bundled editorial serif (Newsreader) for greetings, access-page headline and page titles; locally bundled DM Sans for operational copy. Relaxed serif letter spacing, 13-14px operational body, 11-12px labels, tabular numbers. Avoid huge marketing typography inside working screens.

Layout: reproduce the collage's overlapping, slightly rotated ivory panels over a softly textured neutral canvas. Keep its left-side headline and whitespace, then use fine borders, small corners, restrained shadows, tiny line icons, product illustrations, muted avatar colors, and soft status pills. In the authenticated workspace, the corresponding screens use a quiet sidebar, compact metric cards, chart/activity panels, inventory tables, and focused drawers at readable scale. Preserve the reference's layered card treatment and avoid unrelated gradients or glass effects.

Asset register: leading checkboxes, product thumbnails, names/tags, category, location, status and assignee. Detail: breadcrumbs, large equipment illustration, factual metadata, checkout/return/transfer/report actions and real history. Forms use visible labels and validation, consistent focus rings and clear cancel actions.

Dark mode is a semantic token theme, not an inversion. Light mode is the initial default because it is the supplied reference. Save the user's preference, retain the optional system setting, and set `color-scheme` for native inputs. Keep dark charts, illustrations, menus, badges, empty states, preview panels, and dialogs legible.

## Interaction and responsive contract

- Mobile navigation opens in a labeled, focus-trapped drawer. Operational controls have 44px hit areas. Tables scroll inside their own container; the page must not overflow at 320px.
- Native dialogs provide Escape, focus trapping and return focus. Announce loading/error/success states, preserve entered form values on failure and disable duplicate submissions.
- Use 160ms color/press feedback and 220ms drawer/modal entrance with `cubic-bezier(0.23,1,0.32,1)`. Frequent navigation, filtering and keyboard shortcuts stay immediate. Honor prefers-reduced-motion.
- Global search includes assets, people, locations and requests and navigates to the correct object. Keyboard Ctrl/Cmd+K focuses search.
- Use real saved data for reports and attention items. Show a useful empty state when records are absent.

## Serial Sauron design-engineering gates

1. Foundations: design-system-architecture-spec and blueprint-session. Define Operate surface, product flows and trust boundaries before code.
2. Aesthetic: extract the supplied comp's typography, palette, hierarchy and density. The reference overrides generic design defaults.
3. Identity: preserve AssetHub's cube mark, warm neutrals, forest palette and editorial type across all screens.
4. Interaction: apply emil-design-eng's purposeful motion, native expectations and reduced-motion rules.
5. Vision to code: visual-comp-image-to-code-converter uses the supplied comp directly; no generated replacement comp is needed.
6. Enforcement: zero-placeholder-code-enforcer, build/lint, backend lifecycle/isolation proofs and Playwright visual review in both themes at desktop and 320px.

User authorization covers execution, restructuring, GitHub push and redeployment. Repeated blueprint approvals are unnecessary. Protect the existing database and preserve untracked user learning/résumé files.
