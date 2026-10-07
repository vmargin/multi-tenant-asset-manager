# AssetHub design specification

## Visual direction and access layout

The user-supplied image is the visual authority for AssetHub's style and theme, not for the login page's composition or content. Carry over its warm paper canvas, ivory surfaces, forest-green actions, editorial serif headlines, compact sans-serif labels, fine borders, restrained shadows, and soft texture. The public root is a functional sign-in screen; do not reproduce the full dashboard collage or make users scroll past product mockups to reach authentication.

Put sign-in and demo access in the first view. Use a calm split layout with a short product message and a single, compact asset-lifecycle motif beside the working form. On narrow screens, show the form first. Keep registration and invitation acceptance available without competing with the primary sign-in action. Web research informs the required login behavior and safeguards; the image informs the visual language. The design-engineering surface mode is **Operate**; the access page is **Persuade**.

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

Layout: keep the access page spacious and clearly ordered, with a readable form card, visible field labels, a password visibility control, actionable error guidance, and the public demo username and password. Explain that the demo creates an isolated fictional workspace that expires after 24 hours. Do not add a nonfunctional password-reset link; direct account-help requests to the workspace administrator. In the authenticated workspace, use a quiet sidebar, compact metric cards, chart/activity panels, inventory tables, and focused drawers at readable scale. Preserve the reference's fine borders, small corners, warm surfaces, restrained shadows, and soft status pills; avoid unrelated gradients or glass effects.

Asset register: leading checkboxes, product thumbnails, names/tags, category, location, status and assignee. Detail: breadcrumbs, large equipment illustration, factual metadata, checkout/return/transfer/report actions and real history. Forms use visible labels and validation, consistent focus rings and clear cancel actions.

Dark mode is a semantic token theme, not an inversion. Light mode is the initial default because it is the supplied reference. Save the user's preference, retain the optional system setting, and set `color-scheme` for native inputs. Keep dark charts, illustrations, menus, badges, empty states, preview panels, and dialogs legible.

## Interaction and responsive contract

- Mobile navigation opens in a labeled, focus-trapped drawer. Operational controls have 44px hit areas. Tables scroll inside their own container; the page must not overflow at 320px.
- Login and registration fields have visible labels and browser autocomplete semantics; the password can be revealed without submitting. Announce errors, preserve entered values on failure, and disable duplicate submissions.
- Demo credentials open only the existing public synthetic demo endpoint; they must never authenticate to a real tenant account.
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
