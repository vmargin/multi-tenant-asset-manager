# AssetHub design specification

## Visual authority

The user-supplied image is the only aesthetic authority. Its collage shows separate application screens and interaction states; implement those as navigable pages and drawers. The design-engineering surface mode is **Operate**; the access page is **Persuade**.

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

Layout: 236px quiet sidebar, 76px top bar, main content with 36-44px padding and a 1440px content ceiling. Four compact summary cards. Two-column chart/activity row. Fine 1px borders, 8-12px corners, restrained shadows on popovers and drawers only. No gratuitous gradients, glass effects or nested panels. Use tiny line icons, product illustrations, muted avatar colors and soft status pills.

Asset register: leading checkboxes, product thumbnails, names/tags, category, location, status and assignee. Detail: breadcrumbs, large equipment illustration, factual metadata, checkout/return/transfer/report actions and real history. Forms use visible labels and validation, consistent focus rings and clear cancel actions.

Dark mode is a semantic token theme, not an inversion. Save the user's preference and respect system mode when no explicit preference exists. Set color-scheme for native inputs. Keep dark charts, illustrations, menus, badges, empty states and dialogs legible.

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
