# pi-superpowers Testing Design

## Goal

Add unit tests for the plan-tracker extension and automated validation for all skill content, so changes don't silently break functionality or introduce stale references.

## Scope

Two test suites:

1. **Plan-tracker extension tests** — unit tests for the tool logic (init, update, status, clear, error handling, state reconstruction, widget formatting)
2. **Skill content validation tests** — automated checks that all skills have valid structure, cross-references resolve, and referenced files exist

## Non-Goals

- Behavioral tests (do skills actually change LLM behavior) — deferred to pi-superpowers-plus
- TUI rendering tests (visual widget output) — too coupled to terminal state
- Integration tests requiring a running pi instance

---

## Test Infrastructure

### Runner

Vitest. Lightweight, TypeScript-native, no compilation step.

### Setup

```json
// package.json additions
{
  "devDependencies": {
    "vitest": "^3.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

### File Structure

```
tests/
├── extension/
│   └── plan-tracker.test.ts
└── skills/
    └── skill-validation.test.ts
```

---

## Suite 1: Plan-Tracker Extension Tests

### Challenge

The plan-tracker extension exports a default function that takes `ExtensionAPI` — the full pi extension interface. We can't instantiate a real pi runtime in unit tests.

### Approach

Extract the pure logic into testable functions, then test those directly. The extension has three categories of logic:

1. **Action handlers** — init, update, status, clear. Pure functions: input → output.
2. **State reconstruction** — walk session branch, find latest plan_tracker result. Depends on session data shape.
3. **Widget/status formatting** — transform task list into display strings. Pure functions.

### Extraction

Factor the extension into two files:

```
extensions/
├── plan-tracker.ts          # Extension wiring (registerTool, event hooks, widget)
└── plan-tracker-core.ts     # Pure logic (action handlers, formatting, reconstruction)
```

`plan-tracker-core.ts` exports pure functions with no pi dependencies:

```typescript
export interface Task {
  name: string;
  status: TaskStatus;
}

export interface ActionResult {
  text: string;
  tasks: Task[];
  error?: string;
}

export function handleInit(tasks: string[]): ActionResult { ... }
export function handleUpdate(tasks: Task[], index: number, status: TaskStatus): ActionResult { ... }
export function handleStatus(tasks: Task[]): ActionResult { ... }
export function handleClear(tasks: Task[]): ActionResult { ... }
export function formatStatus(tasks: Task[]): string { ... }
export function formatWidgetText(tasks: Task[]): { icons: string; complete: number; total: number; currentName: string } { ... }
export function reconstructFromBranch(entries: BranchEntry[]): Task[] { ... }
```

`plan-tracker.ts` becomes thin wiring that imports these and connects them to `pi.registerTool()`, event handlers, and widget rendering.

### Test Cases

#### Action Handlers

```
init:
  ✓ creates tasks from string array, all pending
  ✓ returns error when tasks array is empty
  ✓ returns error when tasks is undefined

update:
  ✓ sets task status to complete
  ✓ sets task status to in_progress
  ✓ sets task status back to pending
  ✓ returns error when no plan active
  ✓ returns error when index out of range (negative)
  ✓ returns error when index out of range (too high)
  ✓ returns error when index or status missing

status:
  ✓ returns formatted status with counts
  ✓ returns "no plan active" when empty

clear:
  ✓ returns cleared message with count
  ✓ returns "no plan was active" when already empty
```

#### Formatting

```
formatStatus:
  ✓ shows complete/total counts
  ✓ shows icon per task (✓ → ○)
  ✓ handles all-complete
  ✓ handles all-pending
  ✓ handles mixed states

formatWidgetText:
  ✓ returns icons string, counts, current task name
  ✓ current task is first in_progress
  ✓ current task falls back to first pending
  ✓ returns empty when no tasks
```

#### State Reconstruction

```
reconstructFromBranch:
  ✓ returns empty when no plan_tracker entries
  ✓ returns latest task state from multiple entries
  ✓ ignores entries with errors
  ✓ ignores non-plan_tracker entries
  ✓ handles init followed by updates
  ✓ handles clear (returns empty)
```

---

## Suite 2: Skill Content Validation Tests

### Approach

Read the filesystem, parse frontmatter and markdown, assert structural invariants. No mocking needed — these are pure content checks.

### Test Cases

#### Frontmatter Validation

```
every skill:
  ✓ has a SKILL.md file
  ✓ has valid YAML frontmatter with --- delimiters
  ✓ has a "name" field
  ✓ name matches parent directory name
  ✓ name is lowercase, a-z, 0-9, hyphens only
  ✓ name is ≤ 64 characters
  ✓ has a "description" field
  ✓ description is ≤ 1024 characters
  ✓ description is non-empty
```

#### Cross-References

```
/skill: references:
  ✓ every /skill:name reference points to an existing skill directory
  ✓ no broken cross-references across all skills

file references:
  ✓ every .md file referenced in SKILL.md exists in the skill directory
  ✓ every .sh file referenced in SKILL.md exists in the skill directory
  ✓ every .ts file referenced in SKILL.md exists in the skill directory
```

#### Structural Checks

```
package.json:
  ✓ pi.skills includes "skills" directory
  ✓ pi.extensions includes "extensions/plan-tracker.ts"
  ✓ every skill directory is reachable from pi.skills path

consistency:
  ✓ no orphan skill directories (exists on disk but unreachable)
  ✓ no duplicate skill names across directories
```

### Implementation Sketch

```typescript
import { readdir, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { describe, test, expect } from "vitest";

const SKILLS_DIR = join(__dirname, "../../skills");

async function getSkillDirs(): Promise<string[]> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  // simple YAML key: value parsing
  const lines = match[1].split("\n");
  const result: Record<string, string> = {};
  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) result[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
  }
  return result;
}

describe("skill content validation", () => {
  // ... tests driven by getSkillDirs()
});
```

---

## What Changes in Existing Code

1. **`extensions/plan-tracker.ts`** — extract pure logic to `extensions/plan-tracker-core.ts`, keep wiring in original file
2. **`package.json`** — add vitest devDependency, test script
3. **New files:**
   - `vitest.config.ts`
   - `extensions/plan-tracker-core.ts`
   - `tests/extension/plan-tracker.test.ts`
   - `tests/skills/skill-validation.test.ts`

No skill content changes. No behavior changes. Pure additive.
