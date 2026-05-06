---
name: code
description: "Use when the user invokes /code or asks Codex to implement the next open GitHub issue in this repository: find the smallest-numbered open issue, understand its description, make code changes, commit incremental work when useful, run checks and tests, create a final commit with a Closes #N message, and push the branch."
---

# Code

## Workflow

1. Start in the repository root and inspect `git status --short` plus the current branch. Preserve any unrelated user changes; stage and commit only intentional files for the issue.
2. Find the next open GitHub issue by smallest issue number:

   ```bash
   python3 .agents/skills/code/scripts/next_issue.py --markdown
   ```

   If the helper cannot run, use `gh issue list --state open --limit 1000 --json number,title,url --jq 'sort_by(.number)[0]'`, then `gh issue view NUMBER --json number,title,body,url,labels,assignees,milestone,createdAt,updatedAt`. Request approval if GitHub network access or authentication is blocked by the environment.
3. Read the issue description carefully. If the issue is ambiguous, stale, or unsafe to implement as written, ask the user before changing code.
4. Implement the requested behavior using the repository's existing patterns. Inspect relevant files before editing, keep the change scoped to the issue, and avoid unrelated refactors.
5. Commit along the way when there is a coherent checkpoint:
   - Run `git diff` and `git status --short` before staging.
   - Stage only intentional files.
   - Use ordinary non-closing commit messages for intermediate commits.
   - Do not commit unrelated local changes, generated noise, dependency lockfile churn, or environment files unless they are required by the issue.
6. Run the repository's normal checks before closing the issue. Discover them from package scripts, project docs, CI config, or local conventions. Prefer the full relevant set, such as lint, typecheck, unit tests, integration tests, and build. If a check cannot be run, record the concrete reason.
7. Make sure the final commit contains the closing keyword for the issue number, for example:

   ```text
   Fix issue title

   Closes #123
   ```

   If the final implementation change is already committed, amend the last relevant commit to add the `Closes #N` footer when that is clean. Otherwise create a small final commit, using `git commit --allow-empty -m "Closes #N"` only when there are no remaining file changes to commit.
8. Verify the closing text with `git log -1 --format=%B`. Do not push if checks failed, relevant changes are uncommitted, or the working tree contains unresolved conflict markers.
9. Push the current branch after the checks pass:

   ```bash
   git push origin HEAD
   ```

   Use the repository's configured upstream instead only when that is clearly the established local workflow.

## Completion Response

Report the issue number and title, the branch pushed, the commits created, and the checks run. Include any checks that were skipped or failed and why.
