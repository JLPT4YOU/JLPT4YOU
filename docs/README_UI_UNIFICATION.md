# UI Unification Guide (Tailwind v4)

Goal: Eliminate inconsistent UI caused by mixed Tailwind v3/v4 utilities, duplicated custom utilities, and ad‑hoc components. Establish a single, maintainable design system using Tailwind v4, the existing token/theme setup, and a unified Card + spacing model.

Scope
- Applies to all pages/components in src/app and src/components.
- Focus areas: spacing/container, hover/focus states, Card, and Tailwind utility collision.

Principles
- One source of truth per concern:
  - Spacing/containers: app-container, app-content, app-section.
  - Visual tokens: src/styles/base/variables.css + src/styles/themes/tailwind-config.css.
  - Hover/Focus: src/styles/base/hover-system.css + src/styles/base/focus-fix.css.
  - Card: src/components/ui/card.tsx.
- Zero class-name conflicts with Tailwind: any custom utility must use a distinct prefix (e.g., u- or app- or crit-).
- Prefer component composition over ad-hoc utility bundles for repeatable patterns.

Current issues summary (for context)
- Custom px-/py-/space- utilities redefined in src/app/globals.css with !important, colliding with Tailwind semantics.
- Critical CSS redefines generic classes (.grid, .grid-cols-*, .btn, .container), risking conflicts.
- Mixed use of Tailwind utilities and custom layout classes without a single container system.
- Card patterns implemented differently across pages (different paddings/radii/shadows), not leveraging the shared Card component.

Phased Plan

Phase 1 — Remove conflicts, keep visuals stable
Objective: Eliminate Tailwind utility collisions and undefined custom classes without breaking UI.

Checklist
- Remove or rename all custom utilities that duplicate Tailwind core classes from src/app/globals.css:
  - px-*, py-*, p-*, space-x-*, space-y-*, gap-* etc.
  - If any are still needed (e.g., logical properties), reintroduce them with a prefix (example: .u-px-4) and only where necessary.
- Critical CSS rename/trim (src/components/performance/critical-css.tsx):
  - Remove or prefix generic classes: .grid, .grid-cols-*, .btn, .container → use .crit-grid, .crit-grid-cols-*, .crit-btn, .crit-container or, preferably, delete and rely on Tailwind utilities + components.
  - Keep only true “critical” above-the-fold rules and token resets.
- Fix “orphan” custom classes (e.g., focus-input) that have no definitions:
  - Replace with existing standardized classes (focus-ring, focus-visible) or implement them in hover-system.css with a prefixed name.

How to search
- Search for: " px-", " py-", " space-x-", " space-y-", " gap-", and class names in Critical CSS (.grid, .grid-cols-*, .btn, .container).

Acceptance criteria
- No custom classes share names with Tailwind core utilities.
- Critical CSS contains no Tailwind-looking class names without a prefix.
- No references to undefined classes remain.

Rollback
- Commit per file/group; revert specific commits if visual regressions appear.

Phase 2 — Spacing and container standardization
Objective: Use a single container/section model across the app.

Standards
- app-container: horizontal padding responsive (mobile/tablet/desktop).
- app-content: width wrapper with mx-auto.
- app-section: vertical spacing per token.

Migration steps
- Page skeletons (headers, breadcrumbs, page sections) must be wrapped as:
  <div className="app-container app-section">
    <div className="app-content"> ... </div>
  </div>
- Replace repeated px-4 sm:px-6 lg:px-8 wrappers on page-level structures with the above.
- Keep component-level fine-tuning with Tailwind utilities but avoid reintroducing page-level spacing inconsistently.

Acceptance criteria
- 100% page templates and headers use app-container/app-section/app-content.
- No duplicate page-level spacing wrappers remain.

Phase 3 — Card standardization (single source of truth)
Objective: Replace ad-hoc cards with a unified component API.

Use the shared Card
- src/components/ui/card.tsx is the base. Extend it via props for consistency.

Proposed API extensions (optional)
- size: "sm" | "md" | "lg" (controls padding: p-4/p-6/p-8)
- radius: "sm" | "md" | "lg" | "xl" (maps to tokens)
- elevation: "none" | "sm" | "md" (shadow)
- interactive: boolean (already supported; adds hover-card)

Example usage
- Basic: <Card><CardHeader/><CardContent/></Card>
- Interactive: <Card interactive className="..."> ... </Card>
- With size: <Card className="p-6"> ... </Card> (until size prop is added)

Migration patterns
- Replace divs like bg-background rounded-2xl p-6 border with <Card className="rounded-2xl p-6" /> or prefer default styles and minimal overrides.
- Replace per-page unique paddings with Card size.

Acceptance criteria
- ≥90% card-like blocks use Card.
- Card visual tokens (radius, shadow, colors) are consistent across pages.

Phase 4 — Guardrails (linting/CI)
Objective: Prevent regressions and reintroduction of conflicts.

Status & Implementation
- Stylelint: Successfully installed and configured to prevent custom utility classes that conflict with Tailwind's core spacing, layout, and component classes.
- ESLint (Tailwind Plugin): Installation is on hold. The current version of `eslint-plugin-tailwindcss` requires Tailwind CSS v3.4, while this project uses v4. This step can be revisited once a compatible version of the plugin is released.

Stylelint Setup
- Packages installed: `stylelint`, `stylelint-config-standard`.
- Configuration (`.stylelintrc.json`):
  ```json
  {
    "extends": ["stylelint-config-standard"],
    "rules": {
      "at-rule-no-unknown": [
        true,
        {
          "ignoreAtRules": [
            "tailwind",
            "apply",
            "variants",
            "responsive",
            "screen",
            "theme"
          ]
        }
      ],
      "selector-class-pattern": [
        "^(?!p(|x|y|t|b|l|r)-|m(|x|y|t|b|l|r)-|space-(x|y)-|gap-|grid(|-cols.*)?$|container$|btn$).+$",
        {
          "message": "Do not define custom classes that collide with Tailwind utilities (p-*, m-*, space-*, gap-*, grid-*, container, btn)."
        }
      ]
    }
  }
  ```

How to Run Linters
- To check CSS files for rule violations:
  ```bash
  npm run lint:css
  ```
- To automatically fix fixable issues:
  ```bash
  npm run lint:css:fix
  ```
- To run all linters (JS/TS and CSS):
  ```bash
  npm run lint:all
  ```

CI Gating
- A CI step should be added to the primary workflow (e.g., GitHub Actions) to run `npm run lint:all` on every pull request to ensure code quality and consistency.

Naming conventions & prefixes
- Custom utilities: use u- or app- prefix (e.g., .u-inline-padding, .app-gap-md).
- Critical CSS: use crit- prefix (e.g., .crit-header, .crit-grid).
- Do not use Tailwind-like names for custom utilities.

Do / Don’t
- Do use app-container/app-section/app-content for page-level spacing.
- Do use the Card component for any card-like surface.
- Do use hover-system.css classes (hover-card, focus-ring, etc.) for consistency.
- Don’t redefine Tailwind utilities in CSS (px-*, py-*, space-*, grid-cols-*…).
- Don’t reintroduce generic class names in Critical CSS.

Testing & verification
- Visual QA: compare key pages (Landing, Study, JLPT, Library, Settings) before/after.
- DevTools audit: verify container wrappers present and padding/margins consistent at breakpoints.
- Accessibility: ensure focus-visible styles work uniformly (keyboard nav).
- Performance: rerun Lighthouse to ensure no regressions from Critical CSS changes.

Rollout approach
- Phase 1 and 2 first to stabilize structure.
- Phase 3 migrate cards module by module (Practice, Library, Settings…) to keep PRs small.
- Phase 4 add guardrails once visual parity is confirmed.

Appendix — Snippets

Card variations (until props are added)
- Small: <Card className="p-4" />
- Medium: <Card className="p-6" />
- Large: <Card className="p-8" />
- Radius variants via tokens (example): <Card className="rounded-2xl" />
- Elevation: <Card className="shadow-sm" /> or add custom elevation utility names with u- prefix if needed.

Critical CSS naming example
- Before: .grid { display: grid; gap: 1.5rem; }
- After: .crit-grid { display: grid; gap: 1.5rem; }

Search matrix (common patterns)
- Colliding utilities: " .px-", " .py-", " space-x-", " space-y-", " gap-" in CSS files.
- Critical CSS conflicts: ".grid", ".grid-cols-", ".btn", ".container" in critical-css.tsx.
- Orphan classes: "focus-input" references.

Ownership & Review
- Code owners: UI/Frontend team.
- Review checklist per PR:
  - No Tailwind-like custom utility names introduced.
  - app-container/app-section/app-content used where applicable.
  - Card component used for card-like blocks.
  - Hover/focus classes from hover-system.css or Tailwind adopted.

