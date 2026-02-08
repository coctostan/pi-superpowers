# Design Review: pi-superpowers (2026-02-08)

Using `using-superpowers` skill to ensure I check for relevant skills and follow the requested review focus.

## High-level
- The overall direction (skills + one small extension; no Claude bootstrap) makes sense.
- Biggest risk: removing the *behavioral* “always check skills” nudge entirely. Pi discovers skills, but it doesn’t inherently *force* the agent to use them.

## 1) Missing skills / files
- **Consider keeping a `using-superpowers` skill (as a normal skill, not a hook).**
  - The design currently lists `using-superpowers/` as excluded.
  - Without it, the “related skills” block only helps *after* a skill is already loaded.
  - Minimal fix: include `skills/using-superpowers/SKILL.md` and recommend starting sessions with `/skill:using-superpowers` in the README.
- **README is underspecified in the repo today.** The design implies a package users install; it should at least cover:
  - install (`pi install ...`),
  - how to invoke skills (`/skill:brainstorming`, etc.),
  - what `plan_tracker` is and how to use it.
- **LICENSE attribution gap (repo vs design):** design calls for dual copyright attribution to upstream MIT content; current repo LICENSE does not include it.

## 2) Plan tracker scope (too much / too little)
- Scope feels *about right* (init/update/status + a tiny widget).
- Add one action to reduce footguns:
  - **`clear`** (or `init` with empty tasks) to explicitly remove state + clear widget.
- Consider whether **index-based updates** are enough long-term:
  - Index is fine for “lightweight”, but becomes brittle if tasks are edited/reordered.
  - If you want a tiny upgrade without bloat: allow `update` by either `index` *or* `id` (string).

## 3) State management + lifecycle correctness
- The proposed `pi.appendEntry("plan_tracker", ...)` approach is valid (custom entries don’t enter LLM context).
- However, to keep the widget correct across session operations, the extension likely needs to also refresh on:
  - `session_switch`, `session_fork`, and `session_tree` (not just `session_start`).
- Alternative (also valid): store state in the `plan_tracker` toolResult `details` and reconstruct by scanning tool results on the current branch. (Pi docs recommend this pattern for branching correctness.)

## 4) Subagent dispatch gap
- “Dispatch a subagent with the following prompt” is a reasonable degrade path, but it can still confuse users.
- Suggest adding a one-paragraph note in each dispatch-referencing skill:
  - If an automated dispatch mechanism exists (e.g. pi-superteam), use it.
  - Otherwise, instruct the user to run another agent manually with the provided prompt template.

## 5) Cross-reference coverage
- The “Related skills” blockquote is a good idea.
- Small tweak for robustness/UX:
  - Prefer referencing by **skill name** (and optionally “use `/skill:name`”) rather than file paths.
  - File-relative links can be wrong once packaged/installed or viewed outside the repo.

## 6) Things that should be simpler
- **Package structure:** you could rely on conventional directories (`skills/`, `extensions/`) and omit the `pi` manifest initially, but keeping the manifest is fine.
- **Dependencies:** the sample `package.json` is missing `@mariozechner/pi-ai` as a peer dep if the extension uses `StringEnum` (recommended for enum params). Either:
  - add `@mariozechner/pi-ai` to `peerDependencies`, or
  - avoid enums (not recommended).

## Quick priority recommendations
1. Re-add `using-superpowers` as a normal skill + mention it prominently in README.
2. Ensure plan tracker refreshes correctly on tree/session navigation events.
3. Fix LICENSE attribution to match the design’s upstream MIT content note.

## Open questions (to validate the design)
- Should `plan_tracker` state be **session-only** by design, or should there be an optional export-to-markdown action?
- Do you want to support **non-TUI modes** (print/JSON/RPC) explicitly (no widget, but tool still works)?
- Is the goal for users to *always* start with `/skill:using-superpowers`, or do you want an extension-level nudge on first turn?
