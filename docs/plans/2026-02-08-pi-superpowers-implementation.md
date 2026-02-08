# pi-superpowers Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Port superpowers skills from obra/superpowers to pi as a standalone package with adapted references and a plan-tracker extension.

**Architecture:** Copy upstream skill files, apply mechanical transforms (Claude-specific → pi-native), add cross-references, write one extension (plan_tracker tool + TUI widget). The package uses pi's conventional directory layout with a `package.json` manifest.

**Tech Stack:** TypeScript (extension), Markdown (skills), pi extension API (`@mariozechner/pi-coding-agent`, `@sinclair/typebox`, `@mariozechner/pi-ai`, `@mariozechner/pi-tui`)

---

### Prerequisite: Clone Upstream Repository

Tasks 2–13 copy files from the upstream superpowers repo. Clone it once before starting:

```bash
mkdir -p /tmp/pi-github-repos/obra
git clone https://github.com/obra/superpowers.git /tmp/pi-github-repos/obra/superpowers
```

If it's already cloned, pull latest:

```bash
cd /tmp/pi-github-repos/obra/superpowers && git pull
```

---

### Task 1: Project Scaffolding

Create the package structure: `package.json`, updated `LICENSE`, and directory stubs.

**Files:**
- Create: `package.json`
- Modify: `LICENSE`
- Modify: `README.md` (placeholder — full content in Task 15)
- Create: `extensions/` (directory)
- Create: `skills/` (directory, subdirectories created in later tasks)

**Step 1: Create `package.json`**

```json
{
  "name": "pi-superpowers",
  "version": "0.1.0",
  "description": "Superpowers workflow skills adapted for pi",
  "keywords": ["pi-package"],
  "license": "MIT",
  "author": "coctostan",
  "repository": {
    "type": "git",
    "url": "https://github.com/coctostan/pi-superpowers.git"
  },
  "pi": {
    "extensions": ["extensions/plan-tracker.ts"],
    "skills": ["skills"]
  },
  "peerDependencies": {
    "@mariozechner/pi-ai": "*",
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*",
    "@sinclair/typebox": "*"
  }
}
```

**Step 2: Update LICENSE with dual copyright**

Replace the LICENSE with:

```
MIT License

Copyright (c) 2026 coctostan
Copyright (c) 2025 Jesse Vincent (original skill content from obra/superpowers)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 3: Create directory stubs**

```bash
mkdir -p extensions skills
touch extensions/.gitkeep skills/.gitkeep
```

**Step 4: Commit**

```bash
git add package.json LICENSE extensions/.gitkeep skills/.gitkeep
git commit -m "chore: project scaffolding with package.json and dual-copyright LICENSE"
```

---

### Task 2: Copy Reference Files (with Minimal Transforms)

Copy supporting reference files from upstream. These are documentation/scripts/prompt-templates referenced by skills. Most are copied as-is; prompt templates get minimal pi wording transforms.

**Files:**
- Create: `skills/systematic-debugging/condition-based-waiting.md`
- Create: `skills/systematic-debugging/condition-based-waiting-example.ts`
- Create: `skills/systematic-debugging/defense-in-depth.md`
- Create: `skills/systematic-debugging/root-cause-tracing.md`
- Create: `skills/systematic-debugging/find-polluter.sh`
- Create: `skills/test-driven-development/testing-anti-patterns.md`
- Create: `skills/requesting-code-review/code-reviewer.md`
- Create: `skills/subagent-driven-development/implementer-prompt.md`
- Create: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Create: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

**Step 1: Create skill directories and copy files**

The upstream repo is cloned at `/tmp/pi-github-repos/obra/superpowers`. Copy each file:

```bash
mkdir -p skills/systematic-debugging skills/test-driven-development skills/requesting-code-review skills/subagent-driven-development

cp /tmp/pi-github-repos/obra/superpowers/skills/systematic-debugging/condition-based-waiting.md skills/systematic-debugging/
cp /tmp/pi-github-repos/obra/superpowers/skills/systematic-debugging/condition-based-waiting-example.ts skills/systematic-debugging/
cp /tmp/pi-github-repos/obra/superpowers/skills/systematic-debugging/defense-in-depth.md skills/systematic-debugging/
cp /tmp/pi-github-repos/obra/superpowers/skills/systematic-debugging/root-cause-tracing.md skills/systematic-debugging/
cp /tmp/pi-github-repos/obra/superpowers/skills/systematic-debugging/find-polluter.sh skills/systematic-debugging/
cp /tmp/pi-github-repos/obra/superpowers/skills/test-driven-development/testing-anti-patterns.md skills/test-driven-development/
cp /tmp/pi-github-repos/obra/superpowers/skills/requesting-code-review/code-reviewer.md skills/requesting-code-review/
cp /tmp/pi-github-repos/obra/superpowers/skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/
cp /tmp/pi-github-repos/obra/superpowers/skills/subagent-driven-development/spec-reviewer-prompt.md skills/subagent-driven-development/
cp /tmp/pi-github-repos/obra/superpowers/skills/subagent-driven-development/code-quality-reviewer-prompt.md skills/subagent-driven-development/
```

**Step 2: Apply transforms to prompt templates**

The prompt templates in `subagent-driven-development/` contain `Task tool (general-purpose)` and `Task tool (superpowers:code-reviewer)` references. Apply the mechanical transforms from the design:

In `skills/subagent-driven-development/implementer-prompt.md`:
- Replace `Task tool (general-purpose):` with `Dispatch a subagent with this prompt:`

In `skills/subagent-driven-development/spec-reviewer-prompt.md`:
- Replace `Task tool (general-purpose):` with `Dispatch a subagent with this prompt:`

In `skills/subagent-driven-development/code-quality-reviewer-prompt.md`:
- Replace `Task tool (superpowers:code-reviewer):` with `Dispatch a subagent with the code-reviewer template:`
- Replace `Use template at requesting-code-review/code-reviewer.md` with `Use the template at ./code-reviewer.md (in the requesting-code-review skill directory)`

**Step 3: Verify no remaining Claude-specific references in copied files**

```bash
grep -rn "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Invoke Skill\|Task tool" skills/
```

Expected: No matches (or only generic mentions in prose that aren't tool invocations).

**Step 4: Commit**

```bash
git add skills/
git commit -m "feat: copy reference files from upstream superpowers"
```

---

### Task 3: Adapt brainstorming Skill

**Files:**
- Create: `skills/brainstorming/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/brainstorming/SKILL.md`.

Apply these changes:

1. In the frontmatter, keep `name` and `description` as-is (they have no Claude references).

2. In "After the Design" section, replace:
   - `Use superpowers:using-git-worktrees` → `Use `/skill:using-git-worktrees``
   - `Use superpowers:writing-plans` → `Use `/skill:writing-plans``
   - Remove `Use elements-of-style:writing-clearly-and-concisely skill if available` line (external dependency we don't ship).

3. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Consider `/skill:using-git-worktrees` to set up an isolated workspace, then `/skill:writing-plans` for implementation planning.
   ```

**Step 2: Verify no remaining upstream references**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool\|elements-of-style" skills/brainstorming/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add brainstorming skill adapted for pi"
```

---

### Task 4: Adapt writing-plans Skill

**Files:**
- Create: `skills/writing-plans/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/writing-plans/SKILL.md`.

Apply these changes:

1. In the Plan Document Header template, replace:
   ```
   > **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
   ```
   with:
   ```
   > **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.
   ```

2. In the "Execution Handoff" section, replace:
   - `**REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development` → `**REQUIRED SUB-SKILL:** Use `/skill:subagent-driven-development``
   - `**REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans` → `**REQUIRED SUB-SKILL:** New session uses `/skill:executing-plans``

3. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Did you `/skill:brainstorming` first? Ready to implement? Use `/skill:executing-plans` or `/skill:subagent-driven-development`.
   ```

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool\|For Claude" skills/writing-plans/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat: add writing-plans skill adapted for pi"
```

---

### Task 5: Adapt executing-plans Skill

**Files:**
- Create: `skills/executing-plans/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/executing-plans/SKILL.md`.

Apply these changes:

1. In Step 2 (Execute Batch), replace:
   - `Create TodoWrite and proceed` → `Initialize the `plan_tracker` tool and proceed`
   - Any `Mark as in_progress` → `Update task status via `plan_tracker` tool`
   - Any `Mark as completed` → `Update task status via `plan_tracker` tool`

2. In Step 5 (Complete Development), replace:
   - `**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch` → `**REQUIRED SUB-SKILL:** Use `/skill:finishing-a-development-branch``

3. In the Integration section, replace:
   - `**superpowers:using-git-worktrees**` → `**`/skill:using-git-worktrees`**`
   - `**superpowers:writing-plans**` → `**`/skill:writing-plans`**`
   - `**superpowers:finishing-a-development-branch**` → `**`/skill:finishing-a-development-branch`**`

4. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Need an isolated workspace? `/skill:using-git-worktrees`. Verify each task with `/skill:verification-before-completion`. Done? `/skill:finishing-a-development-branch`.
   ```

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool" skills/executing-plans/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "feat: add executing-plans skill adapted for pi"
```

---

### Task 6: Adapt test-driven-development Skill

**Files:**
- Create: `skills/test-driven-development/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/test-driven-development/SKILL.md`.

This skill has very few upstream references. Apply these changes:

1. In the "Testing Anti-Patterns" section at the end, replace:
   - `read @testing-anti-patterns.md` → `Read `testing-anti-patterns.md` in this skill directory`
   (The `@` syntax is Claude-specific for referencing files within a skill.)

2. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Before claiming done, use `/skill:verification-before-completion` to verify tests actually pass.
   ```

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool\|@testing-anti-patterns" skills/test-driven-development/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/test-driven-development/SKILL.md
git commit -m "feat: add test-driven-development skill adapted for pi"
```

---

### Task 7: Adapt systematic-debugging Skill

**Files:**
- Create: `skills/systematic-debugging/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/systematic-debugging/SKILL.md`.

Apply these changes:

1. In Phase 4, Step 1, replace:
   - `Use the \`superpowers:test-driven-development\` skill` → `Use `/skill:test-driven-development``

2. In the "Supporting Techniques" section at the end, replace:
   - `**superpowers:test-driven-development**` → `**`/skill:test-driven-development`**`
   - `**superpowers:verification-before-completion**` → `**`/skill:verification-before-completion`**`

3. Replace `root-cause-tracing.md` reference (keep as-is — it uses relative `in this directory` language which works).

4. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Write a failing test for the bug with `/skill:test-driven-development`. Verify the fix with `/skill:verification-before-completion`.
   ```

**Step 2: Verify**

```bash
grep -n "superpowers:" skills/systematic-debugging/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/systematic-debugging/SKILL.md
git commit -m "feat: add systematic-debugging skill adapted for pi"
```

---

### Task 8: Adapt verification-before-completion Skill

**Files:**
- Create: `skills/verification-before-completion/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/verification-before-completion/SKILL.md`.

This skill has no Claude-specific tool references. The content is entirely agent-agnostic methodology. The only change needed:

1. Replace `your human partner` (if present) with generic phrasing or leave as-is (it's a superpowers convention for referring to the user).

2. No cross-references to add — this is a leaf skill per the design.

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool" skills/verification-before-completion/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/verification-before-completion/SKILL.md
git commit -m "feat: add verification-before-completion skill adapted for pi"
```

---

### Task 9: Adapt subagent-driven-development Skill

**Files:**
- Create: `skills/subagent-driven-development/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/subagent-driven-development/SKILL.md`.

Apply these changes:

1. Replace all `superpowers:*` skill references:
   - `superpowers:using-git-worktrees` → `/skill:using-git-worktrees`
   - `superpowers:writing-plans` → `/skill:writing-plans`
   - `superpowers:requesting-code-review` → `/skill:requesting-code-review`
   - `superpowers:finishing-a-development-branch` → `/skill:finishing-a-development-branch`
   - `superpowers:test-driven-development` → `/skill:test-driven-development`
   - `superpowers:executing-plans` → `/skill:executing-plans`
   - `superpowers:code-reviewer` → the code-reviewer prompt template (at `requesting-code-review/code-reviewer.md`)

2. Replace all `TodoWrite` references:
   - `Create TodoWrite` → `Initialize `plan_tracker` tool`
   - `Mark task complete in TodoWrite` → `Mark task complete via `plan_tracker` tool`
   - `create TodoWrite` (lowercase) → `initialize `plan_tracker` tool`

3. Replace `Task tool` references for dispatching subagents. Throughout the process section and example, replace dispatch instructions with generic language:

   Add a "**How to dispatch**" block after the "Prompt Templates" section:
   ```markdown
   **How to dispatch:**
   - If a dispatch tool is available (e.g. pi-superteam's `team` tool), use it
   - Otherwise, run a second pi instance: `pi -p "prompt from template"`
   - For parallel tasks, use multiple terminal panes (one per task)
   ```

4. In the process flow diagram and example workflow, replace `Task tool (general-purpose)` with "Dispatch subagent" or "dispatch a subagent with the prompt template".

5. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Need an isolated workspace? `/skill:using-git-worktrees`. Need a plan first? `/skill:writing-plans`. Done? `/skill:finishing-a-development-branch`.
   ```

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool" skills/subagent-driven-development/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: add subagent-driven-development skill adapted for pi"
```

---

### Task 10: Adapt dispatching-parallel-agents Skill

**Files:**
- Create: `skills/dispatching-parallel-agents/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/dispatching-parallel-agents/SKILL.md`.

Apply these changes:

1. In the "Dispatch in Parallel" section, replace the Claude Code `Task(...)` example with generic pi dispatch:
   ```markdown
   **How to dispatch:**
   - If a dispatch tool is available (e.g. pi-superteam's `team` tool), use it
   - Otherwise, run a second pi instance per task: `pi -p "prompt"`
   - For parallel tasks, use multiple terminal panes (one per task)
   ```

2. Replace any remaining `Task(...)` calls in the "Real Example" section with generic "dispatch agent" language.

3. No cross-references to add — this is a standalone pattern per the design.

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool\|Task(" skills/dispatching-parallel-agents/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/dispatching-parallel-agents/SKILL.md
git commit -m "feat: add dispatching-parallel-agents skill adapted for pi"
```

---

### Task 11: Adapt requesting-code-review Skill

**Files:**
- Create: `skills/requesting-code-review/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/requesting-code-review/SKILL.md`.

Apply these changes:

1. Replace `superpowers:code-reviewer` references:
   - `Dispatch code-reviewer subagent` → `Dispatch a subagent with the code-reviewer prompt template`
   - `Use Task tool with superpowers:code-reviewer type, fill template at \`code-reviewer.md\`` → `Fill the template at `code-reviewer.md` in this skill directory, then dispatch a subagent with it`

2. Add "How to dispatch" block:
   ```markdown
   **How to dispatch:**
   - If a dispatch tool is available (e.g. pi-superteam's `team` tool), use it
   - Otherwise, run a second pi instance: `pi -p "prompt from template"`
   ```

3. Replace integration section skill references:
   - `superpowers:*` → `/skill:name` format

4. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Before requesting review, verify with `/skill:verification-before-completion` that tests pass.
   ```

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool" skills/requesting-code-review/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/requesting-code-review/SKILL.md
git commit -m "feat: add requesting-code-review skill adapted for pi"
```

---

### Task 12: Adapt receiving-code-review Skill

**Files:**
- Create: `skills/receiving-code-review/SKILL.md`

**Step 1: Copy upstream and apply transforms**

Copy from `/tmp/pi-github-repos/obra/superpowers/skills/receiving-code-review/SKILL.md`.

This skill has very few Claude-specific references. Apply:

1. Replace any `CLAUDE.md` references:
   - `explicit CLAUDE.md violation` → `a bad practice` (or remove the parenthetical)

2. No cross-references to add — this is triggered by review feedback, standalone.

**Step 2: Verify**

```bash
grep -n "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool" skills/receiving-code-review/SKILL.md
```

Expected: No matches.

**Step 3: Commit**

```bash
git add skills/receiving-code-review/SKILL.md
git commit -m "feat: add receiving-code-review skill adapted for pi"
```

---

### Task 13: Adapt finishing-a-development-branch and using-git-worktrees Skills

**Files:**
- Create: `skills/finishing-a-development-branch/SKILL.md`
- Create: `skills/using-git-worktrees/SKILL.md`

**Step 1: Copy and adapt finishing-a-development-branch**

Copy from upstream. Apply:

1. Replace Integration section references:
   - `superpowers:using-git-worktrees` → `/skill:using-git-worktrees`
   - All other `superpowers:*` → `/skill:name`

2. Add a Related Skills blockquote after the frontmatter:
   ```markdown
   > **Related skills:** Verify tests pass with `/skill:verification-before-completion`. Consider `/skill:requesting-code-review` before merging.
   ```

**Step 2: Copy and adapt using-git-worktrees**

Copy from upstream. Apply:

1. Replace `CLAUDE.md` references:
   - `Check CLAUDE.md` → `Check project configuration (README.md, .pi/settings.json, AGENTS.md)`
   - `CLAUDE.md preference` → `project configuration preference`
   - `If preference specified` context remains the same.

2. Replace Integration section references:
   - All `superpowers:*` → `/skill:name`

3. No cross-references to add — this is an infrastructure skill.

**Step 3: Verify both**

```bash
grep -rn "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Task tool" skills/finishing-a-development-branch/SKILL.md skills/using-git-worktrees/SKILL.md
```

Expected: No matches.

**Step 4: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md skills/using-git-worktrees/SKILL.md
git commit -m "feat: add finishing-a-development-branch and using-git-worktrees skills"
```

---

### Task 14: Plan Tracker Extension

Create the plan-tracker extension: one tool with four actions (`init`, `update`, `status`, `clear`) and a TUI widget.

**Files:**
- Create: `extensions/plan-tracker.ts`

**Step 1: Write the extension**

> **Design doc divergence (intentional):** The design doc mentions `pi.appendEntry("plan_tracker", ...)` for state storage. This plan uses `toolResult.details` instead — state is stored in tool result details and reconstructed by walking the branch. This is the preferred approach per pi's extension docs ("State Management" section) because it handles session branching correctly (each branch sees only its own tool results). The API role literal is confirmed as `"toolResult"` (camelCase) from `@mariozechner/pi-ai` types.

```typescript
/**
 * Plan Tracker Extension
 *
 * Replaces TodoWrite with a native pi tool for tracking plan progress.
 * State is stored in tool result details for proper branching support.
 * Shows a persistent TUI widget above the editor.
 */

import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type, type Static } from "@sinclair/typebox";

type TaskStatus = "pending" | "in_progress" | "complete";

interface Task {
  name: string;
  status: TaskStatus;
}

interface PlanTrackerDetails {
  action: "init" | "update" | "status" | "clear";
  tasks: Task[];
  error?: string;
}

const PlanTrackerParams = Type.Object({
  action: StringEnum(["init", "update", "status", "clear"] as const, {
    description: "Action to perform",
  }),
  tasks: Type.Optional(
    Type.Array(Type.String(), {
      description: "Task names (for init)",
    })
  ),
  index: Type.Optional(
    Type.Integer({
      minimum: 0,
      description: "Task index, 0-based (for update)",
    })
  ),
  status: Type.Optional(
    StringEnum(["pending", "in_progress", "complete"] as const, {
      description: "New status (for update)",
    })
  ),
});

export type PlanTrackerInput = Static<typeof PlanTrackerParams>;

function formatWidget(tasks: Task[], theme: Theme): string {
  if (tasks.length === 0) return "";

  const complete = tasks.filter((t) => t.status === "complete").length;
  const icons = tasks
    .map((t) => {
      switch (t.status) {
        case "complete":
          return theme.fg("success", "✓");
        case "in_progress":
          return theme.fg("warning", "→");
        default:
          return theme.fg("dim", "○");
      }
    })
    .join("");

  // Find current task (first in_progress, or first pending)
  const current =
    tasks.find((t) => t.status === "in_progress") ??
    tasks.find((t) => t.status === "pending");
  const currentName = current ? `  ${current.name}` : "";

  return `${theme.fg("muted", "Tasks:")} ${icons} ${theme.fg("muted", `(${complete}/${tasks.length})`)}${currentName}`;
}

function formatStatus(tasks: Task[]): string {
  if (tasks.length === 0) return "No plan active.";

  const complete = tasks.filter((t) => t.status === "complete").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;

  const lines: string[] = [];
  lines.push(`Plan: ${complete}/${tasks.length} complete (${inProgress} in progress, ${pending} pending)`);
  lines.push("");
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const icon =
      t.status === "complete" ? "✓" : t.status === "in_progress" ? "→" : "○";
    lines.push(`  ${icon} [${i}] ${t.name}`);
  }
  return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
  let tasks: Task[] = [];

  const reconstructState = (ctx: ExtensionContext) => {
    tasks = [];
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type !== "message") continue;
      const msg = entry.message;
      if (msg.role !== "toolResult" || msg.toolName !== "plan_tracker") continue;
      const details = msg.details as PlanTrackerDetails | undefined;
      if (details && !details.error) {
        tasks = details.tasks;
      }
    }
  };

  const updateWidget = (ctx: ExtensionContext) => {
    if (!ctx.hasUI) return;
    if (tasks.length === 0) {
      ctx.ui.setWidget("plan_tracker", undefined);
    } else {
      ctx.ui.setWidget("plan_tracker", (_tui, theme) => {
        return new Text(formatWidget(tasks, theme), 0, 0);
      });
    }
  };

  // Reconstruct state + widget on session events
  for (const event of [
    "session_start",
    "session_switch",
    "session_fork",
    "session_tree",
  ] as const) {
    pi.on(event, async (_event, ctx) => {
      reconstructState(ctx);
      updateWidget(ctx);
    });
  }

  pi.registerTool({
    name: "plan_tracker",
    label: "Plan Tracker",
    description:
      "Track implementation plan progress. Actions: init (set task list), update (change task status), status (show current state), clear (remove plan).",
    parameters: PlanTrackerParams,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      switch (params.action) {
        case "init": {
          if (!params.tasks || params.tasks.length === 0) {
            return {
              content: [{ type: "text", text: "Error: tasks array required for init" }],
              details: {
                action: "init",
                tasks: [...tasks],
                error: "tasks required",
              } as PlanTrackerDetails,
            };
          }
          tasks = params.tasks.map((name) => ({ name, status: "pending" as TaskStatus }));
          updateWidget(ctx);
          return {
            content: [
              {
                type: "text",
                text: `Plan initialized with ${tasks.length} tasks.\n${formatStatus(tasks)}`,
              },
            ],
            details: { action: "init", tasks: [...tasks] } as PlanTrackerDetails,
          };
        }

        case "update": {
          if (params.index === undefined || !params.status) {
            return {
              content: [
                { type: "text", text: "Error: index and status required for update" },
              ],
              details: {
                action: "update",
                tasks: [...tasks],
                error: "index and status required",
              } as PlanTrackerDetails,
            };
          }
          if (tasks.length === 0) {
            return {
              content: [{ type: "text", text: "Error: no plan active. Use init first." }],
              details: {
                action: "update",
                tasks: [],
                error: "no plan active",
              } as PlanTrackerDetails,
            };
          }
          if (params.index < 0 || params.index >= tasks.length) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: index ${params.index} out of range (0-${tasks.length - 1})`,
                },
              ],
              details: {
                action: "update",
                tasks: [...tasks],
                error: `index ${params.index} out of range`,
              } as PlanTrackerDetails,
            };
          }
          tasks[params.index].status = params.status;
          updateWidget(ctx);
          return {
            content: [
              {
                type: "text",
                text: `Task ${params.index} "${tasks[params.index].name}" → ${params.status}\n${formatStatus(tasks)}`,
              },
            ],
            details: { action: "update", tasks: [...tasks] } as PlanTrackerDetails,
          };
        }

        case "status": {
          return {
            content: [{ type: "text", text: formatStatus(tasks) }],
            details: { action: "status", tasks: [...tasks] } as PlanTrackerDetails,
          };
        }

        case "clear": {
          const count = tasks.length;
          tasks = [];
          updateWidget(ctx);
          return {
            content: [
              {
                type: "text",
                text: count > 0 ? `Plan cleared (${count} tasks removed).` : "No plan was active.",
              },
            ],
            details: { action: "clear", tasks: [] } as PlanTrackerDetails,
          };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown action: ${params.action}` }],
            details: {
              action: "status",
              tasks: [...tasks],
              error: `unknown action`,
            } as PlanTrackerDetails,
          };
      }
    },

    renderCall(args, theme) {
      let text = theme.fg("toolTitle", theme.bold("plan_tracker "));
      text += theme.fg("muted", args.action);
      if (args.action === "update" && args.index !== undefined) {
        text += ` ${theme.fg("accent", `[${args.index}]`)}`;
        if (args.status) text += ` → ${theme.fg("dim", args.status)}`;
      }
      if (args.action === "init" && args.tasks) {
        text += ` ${theme.fg("dim", `(${args.tasks.length} tasks)`)}`;
      }
      return new Text(text, 0, 0);
    },

    renderResult(result, _options, theme) {
      const details = result.details as PlanTrackerDetails | undefined;
      if (!details) {
        const text = result.content[0];
        return new Text(text?.type === "text" ? text.text : "", 0, 0);
      }

      if (details.error) {
        return new Text(theme.fg("error", `Error: ${details.error}`), 0, 0);
      }

      const taskList = details.tasks;
      switch (details.action) {
        case "init":
          return new Text(
            theme.fg("success", "✓ ") +
              theme.fg("muted", `Plan initialized with ${taskList.length} tasks`),
            0,
            0
          );
        case "update": {
          const complete = taskList.filter((t) => t.status === "complete").length;
          return new Text(
            theme.fg("success", "✓ ") +
              theme.fg("muted", `Updated (${complete}/${taskList.length} complete)`),
            0,
            0
          );
        }
        case "status": {
          if (taskList.length === 0) {
            return new Text(theme.fg("dim", "No plan active"), 0, 0);
          }
          const complete = taskList.filter((t) => t.status === "complete").length;
          let text = theme.fg("muted", `${complete}/${taskList.length} complete`);
          for (const t of taskList) {
            const icon =
              t.status === "complete"
                ? theme.fg("success", "✓")
                : t.status === "in_progress"
                  ? theme.fg("warning", "→")
                  : theme.fg("dim", "○");
            text += `\n${icon} ${theme.fg("muted", t.name)}`;
          }
          return new Text(text, 0, 0);
        }
        case "clear":
          return new Text(
            theme.fg("success", "✓ ") + theme.fg("muted", "Plan cleared"),
            0,
            0
          );
        default:
          return new Text(theme.fg("dim", "Done"), 0, 0);
      }
    },
  });
}
```

**Step 2: Verify the extension loads without syntax errors**

```bash
# Quick syntax check — pi will validate on load
npx tsc --noEmit --esModuleInterop --moduleResolution node --target es2022 extensions/plan-tracker.ts 2>&1 || echo "Note: type checking requires pi packages installed; syntax check is what matters"
```

If the full type check doesn't work (peer deps not installed), at least verify no obvious syntax issues:

```bash
node -e "try { require('jiti')('$(pwd)/extensions/plan-tracker.ts'); console.log('OK'); } catch(e) { console.log(e.message); }"
```

**Step 3: Commit**

```bash
git add extensions/plan-tracker.ts
git commit -m "feat: add plan-tracker extension with TUI widget"
```

---

### Task 15: Write README

**Files:**
- Modify: `README.md`

**Step 1: Write the README**

```markdown
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
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: write README with install, usage, and workflow overview"
```

---

### Task 16: Remove Stubs and Final Verification

Remove any `.gitkeep` files from earlier scaffolding and run a final sweep for missed upstream references.

**Step 1: Remove .gitkeep files**

```bash
rm -f extensions/.gitkeep skills/.gitkeep
```

**Step 2: Verify no Claude-specific references remain**

```bash
grep -rn "superpowers:\|CLAUDE\.md\|TodoWrite\|Skill tool\|Invoke Skill\|Task tool\|elements-of-style" skills/ extensions/
```

Expected: No matches.

**Step 3: Verify all expected files exist**

```bash
echo "=== Skills ==="
for skill in brainstorming writing-plans executing-plans test-driven-development systematic-debugging verification-before-completion subagent-driven-development dispatching-parallel-agents requesting-code-review receiving-code-review finishing-a-development-branch using-git-worktrees; do
  if [ -f "skills/$skill/SKILL.md" ]; then
    echo "✓ $skill"
  else
    echo "✗ MISSING: $skill"
  fi
done

echo ""
echo "=== Reference files ==="
for f in skills/systematic-debugging/condition-based-waiting.md skills/systematic-debugging/condition-based-waiting-example.ts skills/systematic-debugging/defense-in-depth.md skills/systematic-debugging/root-cause-tracing.md skills/systematic-debugging/find-polluter.sh skills/test-driven-development/testing-anti-patterns.md skills/requesting-code-review/code-reviewer.md skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/spec-reviewer-prompt.md skills/subagent-driven-development/code-quality-reviewer-prompt.md; do
  if [ -f "$f" ]; then
    echo "✓ $(basename $f)"
  else
    echo "✗ MISSING: $f"
  fi
done

echo ""
echo "=== Extension ==="
if [ -f "extensions/plan-tracker.ts" ]; then echo "✓ plan-tracker.ts"; else echo "✗ MISSING"; fi

echo ""
echo "=== Package files ==="
for f in package.json LICENSE README.md; do
  if [ -f "$f" ]; then echo "✓ $f"; else echo "✗ MISSING: $f"; fi
done
```

Expected: All ✓, no ✗.

**Step 4: Verify each SKILL.md has valid frontmatter**

```bash
for f in skills/*/SKILL.md; do
  name=$(grep "^name:" "$f" | head -1 | sed 's/name: *//')
  desc=$(grep "^description:" "$f" | head -1)
  dir=$(basename $(dirname "$f"))
  if [ "$name" = "$dir" ]; then
    echo "✓ $dir (name matches dir)"
  else
    echo "✗ $dir: name='$name' doesn't match dir"
  fi
  if [ -n "$desc" ]; then
    echo "  ✓ has description"
  else
    echo "  ✗ MISSING description"
  fi
done
```

Expected: All names match directories, all have descriptions.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
