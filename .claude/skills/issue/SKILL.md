---
name: issue
description: "Use when the user invokes /issue or asks Claude to file a GitHub issue from a brief description. Investigate the codebase (and logs if relevant) to ground the issue in concrete file:line references, then create it with `gh issue create`. Match the tone and structure of existing issues in the repo."
---

# Issue

Turn a short brief from the user into a well-grounded GitHub issue. The bar is: a future implementer (Claude or human) can open the issue and start work without re-deriving context the user already had in their head.

## Workflow

1. **Read the brief.** The user message is the source of truth. Don't invent scope they didn't ask for. If the brief is genuinely too thin to act on (e.g. "file an issue about the chat" with no further detail), ask one or two targeted questions before digging in. A vague brief on a familiar surface is fine — investigate first, ask only if you're still stuck after looking.

2. **Investigate the codebase.** Find the concrete files and line numbers the issue will touch. Use `grep` / `Read` / `Explore` agent as needed. Cite locations as `path/to/file.ts:LINE` so they render as clickable refs in the issue body. Look up:
   - The current state of the code being changed (so the issue can say "today it does X, hardcoded at file:line").
   - Adjacent code the change interacts with (callers, schemas, types).
   - Recent commits that touched the area (`git log --oneline -10 -- path/to/file`) — sometimes context for *why* something is the way it is lives in a recent SHA.

3. **Check logs if the brief is about a bug.** Sources, in order of usefulness:
   - Terminal output the user pasted into the brief — read it carefully, it's usually the load-bearing evidence.
   - The sidecar's stderr if the bug is in AI/chat behavior (`sidecar/src/index.ts` writes human-readable logs to stderr; the supervisor surfaces them through `ai:event`).
   - Browser console via Playwright MCP if the bug is visible in the UI and the dev server is running. Don't spin up Playwright just to take a snapshot — only if console errors or DOM state would actually change the issue.
   - `git log` / `git blame` for "when did this start" questions.

   Skip log-hunting for feature requests. The user knows what they want; logs aren't going to tell you.

4. **Match the repo's issue style.** Before writing the body, skim a couple of recent issues to mirror the tone:
   ```bash
   gh issue list --state all --limit 5
   gh issue view <recent-number>
   ```
   In this repo the user writes direct, opinionated issues with concrete file refs, openly discussed tradeoffs, and explicit "out of scope" notes when the boundary matters. Don't over-format with rigid templates the user doesn't already use.

5. **Draft the issue.** Suggested shape, but adapt to what the brief actually needs:
   - **One-paragraph framing** at the top: what's being asked for and the relevant constraint (Claude-only for now, blocked on X, follows up on commit Y).
   - **What to change**, with file:line citations. If there's a small table or mapping that compresses the change, use it (see issue #51's permission-mode table).
   - **Tradeoffs / open questions** when there are real alternatives — name them and either pick one with reasoning or punt to the implementer.
   - **Out of scope** when the boundary isn't obvious. Skip when it is.

   Keep the title under ~70 chars, imperative, descriptive enough to grep for later.

6. **Confirm before creating, unless the user said "just file it."** Show the user the title and body and ask if it looks right. They have context you don't.

7. **Create with `gh issue create`.** Use a HEREDOC for the body so backticks and newlines survive intact:

   ```bash
   gh issue create --title "Title here" --body "$(cat <<'EOF'
   Body here.
   EOF
   )"
   ```

   Report the issue URL back to the user.

## What not to do

- Don't add labels, milestones, or assignees unless the user asked. The repo doesn't use them by default.
- Don't paste long code blocks the implementer can read in the file itself — link via `file:line` instead. Short snippets are fine when they make a point that's lost without them.
- Don't write checklists for the implementer to tick off ("- [ ] write tests"). The repo's style is prose with concrete refs, not task templates.
- Don't speculate about implementation details the user didn't sign off on. If you have an opinion on *how* to fix it, write it as a tradeoff to consider, not a directive.
- Don't fabricate file paths or line numbers — if you didn't actually read it, don't cite it.
- Don't add new requirements as comments on a closed issue — once it's closed, the work is done and nobody's coming back to read the comment thread. If the user asks for a follow-up to a previously-filed issue, run `gh issue view <number> --json state` first; if it's `CLOSED`, file a new issue that links back to the original (`Follow-up to #<number>: …`) instead of commenting.

## Completion response

One sentence: the issue number, title, and URL. The user will read the issue body in the browser; don't repeat it back.
