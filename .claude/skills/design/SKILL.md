---
name: design
description: "Use when the user invokes /design <element> or asks Claude to make a specific UI element in the app match its counterpart in the `new-main-page/` design bundle. Input is just the element name (e.g. \"user avatar menu\", \"sidebar bottom rail\", \"filter bar\"). Locate the design source, locate the live component, diff the styling, apply targeted edits, and verify visually with Playwright."
---

# Design

Bring a single element of the live app into pixel-parity with the corresponding mockup in `new-main-page/project/`. The design bundle is the source of truth for **visuals only** (layout, spacing, color, typography, animation) — never copy its markup wholesale or import from the bundle. The live app's structure, state, and accessibility wiring stay as they are.

The user's prompt names the element. That is the entire scope. Don't expand to neighboring elements unless the design forces it (e.g. matching the menu requires changing its trigger ring).

## Workflow

1. **Find the design source.** The bundle is `new-main-page/project/`. Always:
   - `Cockpit.html` — primary prototype, contains all CSS in one `<style>` block.
   - `cockpit.jsx` — component structure and behavior (open/close, items, copy).
   - `colors_and_type.css` — shared tokens.

   Locate the element by grepping for the obvious class root (`avatar-menu`, `side-foot`, `filter-bar`, etc.) across both `Cockpit.html` and `cockpit.jsx`. Read the CSS rules **and** the JSX markup so you understand both the styling and the intended item order / copy / icons. Don't render these files in a browser or screenshot them — the source already spells out every dimension and color.

2. **Find the live counterpart.** Grep `src/` for the same conceptual element (the class names usually differ — design uses kebab + short prefixes like `avatar-menu`, our app uses prefixed BEM like `user-menu` / `side-foot-avatar`). The component lives somewhere in `src/components/...`; the styles live in `src/styles/globals.css` under `@layer components`. Read both — you'll edit both.

3. **Diff the visuals systematically.** Walk the design's CSS rule-by-rule and compare to the live rule. Make a quick mental (or written) checklist covering:
   - Container: `min-width`, `padding`, `border-radius`, `background`, `border`, `box-shadow`, `z-index`, animation.
   - Typography per text element: `font-family`, `font-weight`, `font-size`, `line-height`, `color`.
   - Spacing: `gap`, `margin`, `padding`, item heights.
   - Hover / focus / open / disabled / danger variants.
   - Iconography: svg dimensions, stroke width, color.
   - Trigger element treatment (rings, hover state).

   Note design values exactly (e.g. `oklch(0.26 0.012 250)`, not "dark gray"). When the design uses a token we don't have (`--ease-out`, `--vf-ink-850`-only-in-bundle, etc.), substitute the literal value or our nearest existing token — don't introduce the bundle's tokens into our globals.

4. **Edit the CSS first, markup second.** CSS-only edits cover ~90% of cases. Touch the JSX only when:
   - The design has a structural element we don't (e.g. header bottom-border replacing a separator → remove the redundant `<Separator>`).
   - Item count or copy differs and the design is clearly correct.
   - A class hook is missing for a state variant.

   When editing, keep our existing class names — don't rename to match the design's. Replace literal values inline; don't pull in the bundle's `--vf-ink-850` variants if our globals already define equivalents.

5. **Verify visually with Playwright.** This is the inner loop, per the project convention — not a final check.
   - Confirm the dev server is up: `curl -s -o /dev/null -w "%{http_code}" http://localhost:1420`. If it's down, ask the user to start it (`pnpm tauri dev` or `pnpm dev`); do not start it autonomously.
   - `mcp__playwright__browser_navigate` to `http://localhost:1420`.
   - The bundle's design is dark-themed. If the element only reads correctly in dark mode (most do — they hard-code `oklch(0.2x)` surfaces), force dark before screenshotting:
     ```js
     document.documentElement.classList.add('dark');
     localStorage.setItem('versaflow-theme', 'dark');
     ```
   - Open the element (click the trigger via `mcp__playwright__browser_click` on a `data-testid`), then `mcp__playwright__browser_take_screenshot` with `target: '[data-testid="…"]'` to crop tightly.
   - Compare against the design's CSS (you've already read it — no need to render the prototype). If something is off, edit and re-screenshot. Iterate.

6. **Report the changes.** One short list of `file:line` edits and a one-sentence summary of how the element now reads. Skip narration of the diffing process.

## Conventions specific to this bundle

- `new-main-page/` is git-ignored and never imported. Treat it as a read-only reference folder.
- The bundle defines `--vf-ink-850`, `--vf-ink-900`, `--ease-out` etc. that may not exist in `src/styles/globals.css`. Check before using; substitute literals (`ease-out`, hard-coded `oklch(...)`) when missing.
- The design ships custom keyframes (`lin-pop`, etc.). Recreate them locally with a project-prefixed name (e.g. `user-menu-pop`) rather than importing the bundle's `lin-pop`.
- Class-name conventions diverge: design uses short kebab (`lin-row`, `avatar-sq`); our app uses descriptive BEM (`user-menu-item`, `side-foot-avatar`). Don't rename — match visuals, keep names.
- Radix primitives wrap many of our menus. The design uses raw `<button>`s — don't strip Radix to mirror the markup. Use Radix's `data-state`, `data-highlighted`, `data-disabled` attributes for variant styling.

## What not to do

- Don't render `new-main-page/` HTML files in a browser to "see" the design. Read the source directly — it's exact and complete.
- Don't take a screenshot of the prototype as the comparison target. Compare against the CSS values you read.
- Don't restructure the live markup to mirror the prototype. The prototype is throwaway HTML; our React tree has real concerns.
- Don't introduce the bundle's CSS variables into `globals.css`. Use existing tokens or inline literals.
- Don't expand scope. If the user said "user avatar menu", touching the brand row or filter bar is out of scope — ask first.
- Don't skip the visual verification loop. The CSS diff alone misses Radix-positioning quirks, dark-mode contrast, and `oklch` differences that only show up rendered.
- Don't start the dev server yourself. Ask the user if it's down.

## Completion response

One short paragraph naming the element and the visual changes (container, typography, separator, danger color, etc.), followed by a bullet list of `path:line` edits. The user will see the screenshot in the conversation; don't describe it.
