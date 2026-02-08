# Review: `2026-02-08-pi-superpowers-design-gptpro.md`

Reviewed inputs:

- `REVIEW-INSTRUCTIONS.md`
- `2026-02-08-pi-superpowers-design.md`

## Overall take 🧠🛠️

This is a clean, credible port plan. It keeps the *methodology* (the whole point of Superpowers) and sheds Claude-specific scaffolding, while adding a Pi-native “plan tracker” primitive that fits Pi’s philosophy (“extensions, not baked-in features”).

---

## 1) Missing skills or files

### ✅ The exclusions mostly make sense
The table of excluded upstream files is reasonable for “standalone + lightweight” (hooks/commands/plugin metadata/tests won’t port cleanly).

### …but two excluded skills still have standalone value

You excluded:

- `using-superpowers/` (replaced by cross-references)
- `writing-skills/` (meta-skill)

I agree with *not* shipping the Claude bootstrap hook behavior, but **the content of `using-superpowers` is still valuable** as a one-time onboarding doc: it teaches the meta-rule “check skills before doing stuff” and how to find/use skills.

Right now, your replacement (Related Skills block) only appears **after a skill is already loaded**, which means it can’t help with the first “do we use a skill?” decision.

#### Suggested fix (low cost, high leverage)
Add back a *pi-adapted* onboarding skill, but make it non-invasive:

- New skill: `using-pi-superpowers/`
- Content: condensed “always check skills” mindset + Pi-specific invocation syntax
- In README: “Start here: `/skill:using-pi-superpowers`”
- Optional: mark it “user-invocable only” if your skill host supports that sort of frontmatter control

This preserves the “bootstrap knowledge” without reintroducing the always-injected hook.

### `writing-skills/` exclusion is fine, but consider a “contributing” appendix
`writing-skills` is genuinely useful as a how-to-write-skills reference. If you want to keep the package small, leaving it out is defensible; but a small `CONTRIBUTING.md` (or README appendix) that links to upstream guidance preserves contributor ergonomics without shipping the whole skill.

---

## 2) Plan tracker scope

### ✅ Scope feels appropriate for “lightweight”
One tool, three actions, session persistence, and a tiny status widget is squarely in “small but powerful.”

### ⚠️ Biggest risk: API surface assumptions
Your design assumes things like:

- `pi.appendEntry("plan_tracker", …)`
- restoring via `ctx.sessionManager.getBranch()`
- widget via `ctx.ui.setWidget()`

Even if these are *probably* right, **the brittle part is which object owns which capability and what the exact method names are** across Pi versions/forks.

#### Suggested fix: explicitly anchor on the known “todo extension” pattern
Pi ships an example “todo” extension that demonstrates “state via session entries + tool + UI.” Reference that directly as the closest existing pattern:
> “Plan-tracker is basically todo.ts but with plan semantics.”

That reduces ambiguity for implementers and future maintainers.

### Two small design tweaks that improve robustness
1) **Allow `update` by id as well as by index (optional)**  
Index-based updates are fine, but brittle if tasks get edited/reordered mid-session. Consider:
- `init` assigns stable ids (e.g., `task_1`, or a hash of the text)
- `update` accepts `{ id }` *or* `{ index }`

2) **Minimize session bloat (optional)**  
If every `update` appends the *entire* tasks array to the session log, that’s simple—but can bloat sessions. Two alternatives:
- append deltas (`{index,status,updated}`) and reconstruct
- or keep full snapshots only every N updates, deltas otherwise

### Widget UX nit (nice-to-have)
Your widget string is good, but consider terminals without glyph support. Consider ASCII fallback:
- `✓` → `x`
- `→` → `>`
- `○` → `.`

---

## 3) Subagent dispatch gap

### ✅ “Generic dispatch language” is directionally right
Pi intentionally has no built-in sub-agent system; the official vibe is “spawn other Pi instances / use tmux / build your own / install a package.” So your approach of *not assuming* a `team` tool is correct.

### ⚠️ But “dispatch a subagent” can still confuse users
The skills will be read by:
- models that *can’t* actually dispatch (no tool)
- humans who don’t know the intended manual workflow

#### Suggested fix: add a tiny “How to dispatch here” recipe block
In each skill that mentions subagents (`dispatching-parallel-agents`, `subagent-driven-development`, `requesting-code-review`), add a short “Dispatch options” section:

- **If you have pi-superteam**: use it (team tool)
- **If you don’t**: run a second Pi instance in another terminal (or tmux pane) with the prompt template content
- **If you want parallelism**: tmux layout with N panes (one per task)

This makes the skills self-contained for humans too.

---

## 4) Cross-reference coverage

### ✅ The mapping is mostly sensible
The nudges flow “design → plan → execute → finish,” and “debug → verify,” which is the right backbone.

### Two improvements to consider
1) **`requesting-code-review` should nudge verification**
Even if it’s often triggered by other skills, it’s plausible a user invokes it directly. Add:
- → `verification-before-completion` (run tests / lint / etc. before review)

2) **`executing-plans` should nudge verification and/or review**
You currently point executing-plans → worktrees + finishing. Finishing does the verification nudge, but it’s easy to treat executing-plans as “just implement” and stop. One light nudge here helps.

### Important implementation detail: avoid relative-path links for cross-references
You propose:

```md
> **Related skills:** Check if [brainstorming](../brainstorming/SKILL.md) applies…
```

There’s ecosystem confusion about how relative paths in `SKILL.md` resolve (skill dir vs cwd). Prefer **name-based invocation**:

```md
> **Related skills:** Consider `/skill:brainstorming` before starting implementation.
```

This keeps the port more compatible across skill hosts.

---

## 5) Anything that should be simpler

### The “Skill tool → read tool” transform is the biggest simplification opportunity
Your transform says:

- `Skill tool / Invoke Skill tool` → `read tool / load skill with read`

But Pi’s public model for skills is: **invoke via `/skill:name` or allow auto-loading**, not “use read.”

#### Suggested fix
Change the transform to something like:

- `Skill tool` → “invoke the skill (e.g., `/skill:<name>`) or load the skill by name”

This keeps the skills portable across agents, and avoids nudging models toward filesystem browsing.

### `CLAUDE.md` mapping: consider `AGENTS.md`
You map `CLAUDE.md` → `.pi/settings.json` / `README.md`. Another semantic match in the Pi ecosystem is **`AGENTS.md`** as hierarchical project context.

Suggested transform guidance:
- `CLAUDE.md` → `AGENTS.md` (agent context) and optionally `.pi/settings.json` (actual settings)

### Packaging: looks aligned ✅
Your `package.json` `pi` field matches how Pi package resolution works (“declare extensions and skills in package.json”), and `pi-package` is a known keyword convention.

---

## Suggested change list (prioritized)

### P0 (highest impact)
- Add **`using-pi-superpowers`** onboarding skill (or equivalent README/AGENTS guidance) so “check skills first” survives the port.
- Replace “Skill tool → read tool” transform with **`/skill:name` / invoke-by-name** wording.
- Change cross-reference links to **name-based** references (avoid relative paths).

### P1
- Add a “manual dispatch recipe” to subagent-related skills (tmux / second pi instance).
- Add extra cross-reference nudges:
  - requesting-code-review → verification-before-completion
  - executing-plans → verification-before-completion or requesting-code-review

### P2
- Consider `plan_tracker update` by id, and/or delta storage to reduce session bloat.
- ASCII fallback for widget glyphs.

---

## Sources (external references used)
- Upstream Superpowers repo: https://github.com/obra/superpowers
- Superpowers docs site (skills): https://skills.sh/obra/superpowers/
- Pi mono repo (docs/examples): https://github.com/badlogic/pi-mono
  - Extensions docs: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md
  - Example todo extension: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/examples/extensions/todo.ts
  - Pi coding agent README (skills usage): https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md
- Relative-path confusion issue (example): https://github.com/badlogic/pi-mono/issues/1136
- “AGENTS.md” context convention (blog): https://mariozechner.at/posts/2025-11-30-pi-coding-agent/
