---
name: explain
description: Walk the user through a topic in the current codebase one step at a time, displaying the relevant code in their nvim pane via `nvim-show` and pausing between steps until they say "continue". Use when the user invokes `/explain <topic>` or asks Claude to "explain X step by step", "walk me through X", or similar guided code tours. Input is the topic to explain (e.g. "how caching works in the rust layer", "the boot sequence", "the tab state machine").
---

# explain

Guided, paced walkthrough of a topic in the current codebase. The user reads code in their own nvim while you narrate.

## Tool

`nvim-show <file> <start> <end>` — sends `:e <file>` then visually selects lines `start..end` in the user's tmux nvim pane. It exits 1 with `no nvim pane` if no pane is currently running nvim.

If you get `no nvim pane`, open one yourself before continuing:

```bash
tmux split-window -hb -l 60% nvim
```

(`-h` = horizontal split, `-b` = put new pane *before* current = left side, `-l 60%` = size.) Wait ~300ms for nvim to start, then retry `nvim-show`. If you're not inside tmux at all, tell the user — the skill needs a tmux session.

Use **absolute paths** with `nvim-show`, since the user's nvim pane may have a different cwd than yours.

## Audience

The user is a senior developer. They want **contextual understanding** — the shape of the system, the key decisions, the non-obvious wiring — not a line-by-line tour. Skip files that are bulk/boilerplate changes (mass renames, fixture dumps, generated code, repetitive CRUD), and skip stops where the code does exactly what its name says. If a step would just be "here are the 12 files that were touched by the rename", collapse it into one sentence in the wrap-up instead of a stop.

## Flow

1. **Plan the tour.** Read the codebase enough to identify 3–7 meaningful stops that build on each other. Order them so each step makes sense given the previous one — entry point → core logic → edges, not random snippets. Don't pad with trivia; if the topic is small, do 2 steps. Bias toward fewer, denser stops over exhaustive coverage.

2. **Announce the plan briefly.** One short message listing the stops by name (not file paths). This lets the user redirect before you commit to a path. Example:
   > Walking through Rust caching in 4 stops: (1) the cache trait, (2) the LRU impl, (3) where it's wired into the request handler, (4) eviction. Ready?

   Wait for the user to acknowledge before step 1. (If they say "go" / "yes" / "continue" / etc., proceed.)

3. **For each step:**
   - Call `nvim-show <abs-path> <start-line> <end-line>` with a tight range — usually 5–40 lines. Don't dump a 200-line file; pick the lines that matter.
   - Write a short explanation (a few sentences to a short paragraph). Reference symbols by name; assume the user is reading the code in front of them — don't re-quote what's already on their screen.
   - End with a clear pause cue, e.g. `→ say "continue" when ready` or `→ continue?`.
   - **Stop.** End your turn. Do not call any more tools or write any more text.

4. **On "continue"** (or any clear go-ahead), advance to the next step. If the user asks a question instead, answer it, then re-offer to continue. If they redirect ("skip ahead to eviction", "show me the caller instead"), adapt — the plan is a sketch, not a contract.

5. **After the last step**, give a one-paragraph wrap-up tying the stops together. No bullet recap of what you just said — synthesize.

## Style

- One stop per turn. Resist the urge to chain two "small" stops together; the pacing is the point.
- Don't paste large code blocks into your message — the code is in nvim. Quote at most a single line or symbol when it's the subject of a sentence.
- Explanations should add what the code *doesn't* say: why this design, what invariant it preserves, what would break if it changed. If a stop is purely "here's a function that does what its name says", it's not worth a stop.
- Use `file_path:line_number` format when referring to specific lines outside the currently-shown range.

## What NOT to do

- Don't open files with Read just to show them — use `nvim-show`. Read is for *your* understanding during planning; the user reads via nvim.
- Don't skip the plan-and-confirm step, even for small tours. The user may want a different angle than you picked.
- Don't keep going after a step without waiting. "Continue" is a hard gate.
- Don't create a new tmux pane unless `nvim-show` actually fails — if the user already has nvim open, use it.
