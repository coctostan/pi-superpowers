# Review: 2026-02-08 pi-superpowers Implementation Plan (vs Design)

Using `using-superpowers` skill to ensure correct skill usage discipline.

## High-level assessment
The plan is very close to the design: same package shape, same skill set, same “mechanical transforms + related-skills nudges” strategy, and a single `plan_tracker` extension with a widget.

The main issues are a few internal contradictions ("copy unchanged" but then edit), some missing prerequisites (where does `/tmp/pi-github-repos/obra/superpowers` come from?), and a couple of correctness nits in the extension code/steps.

## Major issues (fix before execution)

1. **Task 2 contradicts itself (“Unchanged” vs “Apply transforms”)**
   - Task 2 title/description says reference files are copied “as-is / unchanged”, but Step 2 immediately edits the prompt templates.
   - Recommendation: either (a) rename Task 2 to “Copy reference files (+ minimal pi wording transforms)”, or (b) split prompt-template edits into the later skill-adaptation tasks.

2. **Missing upstream fetch step**
   - The plan assumes upstream is already cloned at `/tmp/pi-github-repos/obra/superpowers`.
   - Recommendation: add a short prerequisite step (once) like:
     - `mkdir -p /tmp/pi-github-repos/obra && git clone https://github.com/obra/superpowers /tmp/pi-github-repos/obra/superpowers`
     - Or document where that mirror comes from.

3. **Task 1 commit references files that aren’t created**
   - Task 1 Step 4: `git add ... extensions/.gitkeep skills/.gitkeep` but Step 3 only runs `mkdir -p`.
   - Recommendation: add `touch extensions/.gitkeep skills/.gitkeep` (or drop committing empty dirs until they contain files).

4. **Design/plan mismatch on extension state strategy (decide explicitly)**
   - Design doc says state via `pi.appendEntry("plan_tracker", ...)`.
   - Implementation plan stores state in **toolResult.details** and reconstructs by walking the branch.
   - This plan approach is actually consistent with pi’s own extension docs (“State Management” section), and usually branches better.
   - Recommendation: update the design doc (or add a note in Task 14) so this doesn’t look like an accidental divergence.

## Extension/code correctness nits (small but real)

1. **`update` action error ordering produces a weird range message when no plan exists**
   - In `update`, you check index bounds before checking `tasks.length === 0`.
   - If `tasks.length === 0`, error becomes `out of range (0--1)` instead of “no plan active”.
   - Recommendation: check `tasks.length === 0` first.

2. **Schema: `index` should be an integer with bounds**
   - Use `Type.Integer({ minimum: 0 })` (and potentially `maximum` dynamically isn’t possible in schema, but minimum is useful).

3. **Tool details shape should be consistent across actions**
   - You always include `details: { action, tasks }` which is good.
   - But `PlanTrackerDetails.action` is typed as the union, so in the “default” case you currently set `action: "status"` even for unknown actions. That’s a little misleading.
   - Recommendation: either widen type to include `"unknown"`, or set `isError: true` and keep action as provided.

4. **Widget line length/wrapping**
   - The widget string can get long (icons + `(x/y)` + current task name). `Text` will wrap, but ANSI-wrapped text can wrap oddly depending on implementation.
   - Not a blocker, but consider truncating current task name (or omit it when terminal is narrow).

## Design alignment checks (what’s good)

- **Skill set and directory layout** matches the design’s Package Structure section.
- **Cross-reference strategy** (Related Skills blockquotes, `/skill:name` syntax) matches design intent.
- **No pi-superteam dependency** is preserved; “How to dispatch” guidance degrades gracefully.
- **Final verification sweeps** (grep for Claude-specific tokens + frontmatter validation) are strong and concrete.

## Small improvements (optional)

- Add a single “global verify” command after each major batch (skills added, extension added) to catch drift early:
  - `grep -rn "superpowers:|CLAUDE\\.md|TodoWrite|Task tool|Skill tool" skills extensions`
- Consider adding `files` or `.npmignore` if you intend to publish to npm, but for git installs it’s optional.

## Suggested minimal edits to the plan

- Task 1 Step 3: add `touch extensions/.gitkeep skills/.gitkeep`.
- Task 2: rename to remove “Unchanged” or move prompt-template transforms out of it.
- Add a short “Prereq: clone upstream repo” section before Task 2.
- Task 14: either change the design doc to match toolResult.details state, or add an explicit note justifying the divergence.
- Task 14 code: reorder `update` checks; make `index` an integer.
