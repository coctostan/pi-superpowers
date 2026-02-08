# Review Instructions

## What this is

A design for porting [obra/superpowers](https://github.com/obra/superpowers) (a Claude Code plugin) to [pi](https://github.com/badlogic/pi-mono) as a standalone package called **pi-superpowers**.

Superpowers provides structured workflow skills for coding agents — brainstorming, TDD, debugging, planning, code review. The methodology is agent-agnostic but the packaging is Claude Code-specific.

## What we're doing

1. **Adapting the skills** — replacing Claude-specific tool references (`Skill` tool, `TodoWrite`, `CLAUDE.md`, `Task` tool) with pi equivalents or generic language
2. **Dropping the bootstrap hook** — Claude Code needs a 3.8KB injection every session to force skill usage; pi's native skill system makes this unnecessary; we replace it with lightweight cross-references in each skill
3. **Adding a plan tracker** — small extension with one tool + TUI widget to replace `TodoWrite` for tracking plan progress, using pi's session state instead of file I/O
4. **Keeping it standalone** — works without pi-superteam (a separate, larger project by the same author that provides automated subagent dispatch)

## What to look for

- **Missing skills or files** — did we drop anything that has standalone value?
- **Plan tracker scope** — is it too much or too little for a "lightweight" package?
- **Subagent dispatch gap** — skills reference "dispatch a subagent" generically since there's no built-in dispatch tool; does this degrade gracefully or leave the user confused?
- **Cross-reference coverage** — do the related-skills nudges per skill make sense, or are any missing/wrong?
- **Anything that should be simpler**

## Key files

- `docs/plans/2026-02-08-pi-superpowers-design.md` — the full design
- [obra/superpowers](https://github.com/obra/superpowers) — the upstream source
