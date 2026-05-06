---
name: code
description: "Use when the user invokes /code or asks Claude to implement the next open GitHub issue in this repository: find the smallest-numbered open issue, understand its description, make code changes, commit incremental work when useful, run checks and tests, create a final commit with a Closes #N message, and push to main."
---

# Code

## Workflow

1. Start in the repository root and inspect `git status --short` plus the current branch. The default branch for this project is `main`; commit directly there. Do **not** create a feature branch and do **not** open a pull request unless the user explicitly asks. Preserve any unrelated user changes; stage and commit only intentional files for the issue.
2. Find the next open GitHub issue by smallest issue number:

   ```bash
   python3 .agents/skills/code/scripts/next_issue.py --markdown
   ```

   If the helper cannot run, use `gh issue list --state open --limit 1000 --json number,title,url --jq 'sort_by(.number)[0]'`, then `gh issue view NUMBER --json number,title,body,url,labels,assignees,milestone,createdAt,updatedAt`. Ask the user before proceeding if `gh` is not authenticated or network access is blocked.

   **If the helper prints `issue-in-progress`** (the smallest open issue already has an assignee), exit immediately without touching any files. This is the lock that lets `/code` run on a recurring loop without two runs racing on the same issue. Report a one-line "Issue #N is already assigned, skipping" and stop.
3. Claim the issue before doing anything else, so a concurrent `/code` run sees it as in-progress and bails:

   ```bash
   gh issue edit <number> --add-assignee @me
   ```

   If the claim fails (e.g. network error), stop — do not edit code while unclaimed.
4. Read the issue description carefully. If the issue is ambiguous, stale, or unsafe to implement as written, ask the user before changing code.
5. Implement the requested behavior using the repository's existing patterns. Inspect relevant files before editing, keep the change scoped to the issue, and avoid unrelated refactors.

   For UI/frontend work, use the `playwright` MCP server as an **inner loop**, not a post-implementation check:
   - Make sure `pnpm dev` is running on `:1420` (the e2e config will start one if absent; or start it manually).
   - Open the affected route with `mcp__playwright__browser_navigate` *before or alongside* the first edit so the starting state is visible.
   - After each meaningful change, reload (`browser_navigate` again, or `browser_evaluate('location.reload()')`) and inspect via `browser_snapshot` / `browser_take_screenshot`. Iterate against what the screenshot actually shows, not what the code is supposed to do.
   - The dev shim in `src/main.tsx` auto-loads `src/dev/tauri-mock.js` when running outside Tauri, so Tauri commands resolve in plain Chromium. To reach a flow that needs non-default data, extend the mock's dispatch table or set an override via `browser_evaluate("window.__TAURI_MOCK__.set('cmd', value)")` — don't assert success blind.
6. Commit along the way when there is a coherent checkpoint:
   - Run `git diff` and `git status --short` before staging.
   - Stage only intentional files (avoid `git add -A` / `git add .`).
   - Use ordinary non-closing commit messages for intermediate commits.
   - Do not commit unrelated local changes, generated noise, dependency lockfile churn, or environment files unless they are required by the issue.
7. Run the repository's normal checks before closing the issue. For VersaFlow that is:
   - `pnpm typecheck` — TS errors block the issue.
   - `pnpm build` — production bundle must succeed.
   - `pnpm test:e2e` — Playwright regression gate. By this point the inner loop in step 5 should already have verified the change visually; this run is just to catch console errors and confirm the smoke layout still renders. A failing run blocks the issue.
   - If a check cannot be run, record the concrete reason.
8. Make sure the final commit contains the closing keyword for the issue number, for example:

   ```text
   Fix issue title

   Closes #123
   ```

   If the final implementation change is already committed, create a small follow-up commit (or `git commit --allow-empty -m "Closes #N"` when there are no remaining file changes) rather than amending — amending a commit that has already been pushed rewrites history.
9. Verify the closing text with `git log -1 --format=%B`. Do not push if checks failed, relevant changes are uncommitted, or the working tree contains unresolved conflict markers.
10. Push directly to `main` after the checks pass:

   ```bash
   git push origin HEAD
   ```

   Pushing the closing commit to `main` will close the issue automatically — no PR needed.

## Completion Response

Report the issue number and title, the commits created, and the checks run. Include any checks that were skipped or failed and why.
