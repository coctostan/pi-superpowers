# pi-superpowers

Structured workflow skills for [pi](https://github.com/badlogic/pi-mono), adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent.

Brainstorming → Planning → TDD → Debugging → Code Review → Finishing — as composable skills your coding agent loads on demand.

## Install

```bash
pi install git:github.com/coctostan/pi-superpowers
```

Or add to `.pi/settings.json` (project-level) or `~/.pi/agent/settings.json` (global):

```json
{
  "packages": ["git:github.com/coctostan/pi-superpowers"]
}
```

## What's Inside

### Skills

| Skill | Description | Invoke |
|-------|-------------|--------|
| **brainstorming** | Socratic design refinement — questions, alternatives, incremental validation | `/skill:brainstorming` |
| **writing-plans** | Detailed implementation plans with bite-sized TDD tasks | `/skill:writing-plans` |
| **executing-plans** | Batch execution with checkpoints for architect review | `/skill:executing-plans` |
| **subagent-driven-development** | Fresh subagent per task with two-stage review | `/skill:subagent-driven-development` |
| **test-driven-development** | RED-GREEN-REFACTOR cycle (includes anti-patterns reference) | `/skill:test-driven-development` |
| **systematic-debugging** | 4-phase root cause investigation | `/skill:systematic-debugging` |
| **verification-before-completion** | Evidence before claims, always | `/skill:verification-before-completion` |
| **requesting-code-review** | Pre-merge review with severity categories | `/skill:requesting-code-review` |
| **receiving-code-review** | Technical evaluation of review feedback | `/skill:receiving-code-review` |
| **dispatching-parallel-agents** | Concurrent subagent workflows | `/skill:dispatching-parallel-agents` |
| **using-git-worktrees** | Isolated development branches | `/skill:using-git-worktrees` |
| **finishing-a-development-branch** | Merge/PR decision workflow | `/skill:finishing-a-development-branch` |

### Plan Tracker

The `plan_tracker` tool replaces file-based task tracking. It stores state in the session and shows progress in the TUI:

```
Tasks: ✓✓→○○ (2/5)  Task 3: Recovery modes
```

Usage by the agent:
```
plan_tracker({ action: "init", tasks: ["Task 1: Setup", "Task 2: Core", ...] })
plan_tracker({ action: "update", index: 0, status: "complete" })
plan_tracker({ action: "status" })
plan_tracker({ action: "clear" })
```

## The Workflow

1. **Brainstorm** — `/skill:brainstorming` refines your idea into a design document
2. **Isolate** — `/skill:using-git-worktrees` creates a clean workspace
3. **Plan** — `/skill:writing-plans` breaks work into bite-sized TDD tasks
4. **Execute** — `/skill:executing-plans` or `/skill:subagent-driven-development` works through the plan
5. **Verify** — `/skill:verification-before-completion` proves it works
6. **Review** — `/skill:requesting-code-review` catches issues
7. **Finish** — `/skill:finishing-a-development-branch` merges or creates a PR

Each skill cross-references related skills so the agent knows what to use next.

## Subagent Dispatch

Skills that reference subagent dispatch (subagent-driven-development, requesting-code-review, dispatching-parallel-agents) work with any dispatch mechanism:

- **With pi-superteam:** The agent uses the `team` tool automatically
- **Without pi-superteam:** Run `pi -p "prompt"` in another terminal, or use tmux panes for parallel tasks

## Attribution

Skill content adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent, licensed under MIT.

## License

MIT — see [LICENSE](LICENSE) for details.
