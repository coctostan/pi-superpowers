# pi-superpowers-plus Design

## Goal

Fork pi-superpowers into a pi-native reimagining that uses extensions for active workflow enforcement, reducing context consumption by ~45% while providing stronger guarantees than text-only instructions.

## Background

pi-superpowers is a faithful port of obra/superpowers. The upstream was designed for Claude Code, which has no extension system — everything must be persuasive text in the system prompt. Pi has tools, event hooks, tool-call interception, widgets, and system prompt injection. This project exploits those capabilities.

## Core Architecture

Three layers replace the current single-layer (skill markdown only) approach:

### Layer 1: Lean Skills (~130 lines average, down from ~190)

Each skill keeps only what must be in context proactively:
- Core principle / iron law
- The process steps (what to do)
- Key persuasion that prevents violations before they happen
- Cross-references to related skills
- One line noting that the enforcement extension provides active monitoring and reference material

Everything else moves out.

### Layer 2: Enforcement Extension

A single extension (`extensions/workflow-monitor.ts`) that:

**Tracks workflow state** by observing tool calls:
- Which files have been written (test files vs source files)
- Whether test commands have been run and their results
- Current TDD phase (RED → GREEN → REFACTOR)
- Current debugging phase (1-4)
- Whether verification commands have been run before completion claims

**Injects targeted warnings** via `tool_result` hooks when violations are detected. These warnings include the specific anti-rationalization content relevant to the violation — not a generic "you did it wrong" but the actual rebuttal from the upstream skill content.

**Shows workflow state** via TUI widgets so the user has visibility into what phase the agent is in.

### Layer 3: Reference Tool

A tool (`workflow_reference`) that serves detailed guidance on demand:
- Rationalization tables
- Anti-pattern lists
- Code examples (good/bad)
- "When stuck" guidance
- Extended process details

Content lives in markdown files in each skill directory, loaded by the tool when called.

---

## What Moves Where

### test-driven-development (373 → ~130 lines)

**Stays in skill:**
- Iron law, RED-GREEN-REFACTOR process, key rules, core "why order matters" argument, verification checklist summary, reference to tool

**Moves to reference tool:**
- Good/bad code examples (~30 lines)
- Extended "why order matters" arguments (~30 lines)
- Rationalization table (12 rows, ~20 lines)
- Red flags list (~20 lines)
- "When stuck" table (~10 lines)
- Bug fix walkthrough example (~30 lines)

**Moves to enforcement extension:**
- Violation detection: source file written without prior test file write → inject relevant rationalization rebuttal into tool_result
- Phase tracking: infer RED/GREEN/REFACTOR from file writes and test runs
- Widget: `TDD: RED → Write failing test`

### systematic-debugging (298 → ~120 lines)

**Stays in skill:**
- Iron law, four phases (condensed), key anti-patterns, reference to tool

**Moves to reference tool:**
- Rationalization table (~15 lines)
- "Human partner's signals" section (~15 lines)
- Extended multi-component diagnostic example (~30 lines)
- Red flags list (~15 lines)
- Quick reference table (~10 lines)

**Moves to enforcement extension:**
- Phase tracking: detect which debugging phase the agent is in based on what it's doing
- Warning if fix attempted without root cause investigation (Phase 1 skipped)
- Warning if 3+ fix attempts detected → inject "question the architecture" guidance
- Widget: `Debug: Phase 2 — Pattern Analysis`

### verification-before-completion (139 → ~80 lines)

**Stays in skill:**
- Iron law, gate function, core red flags

**Moves to reference tool:**
- Common failures table (~15 lines)
- Rationalization prevention table (~15 lines)
- "Why this matters" section (~10 lines)

**Moves to enforcement extension:**
- Detect completion-claiming language in assistant messages (if accessible via context event)
- Check if a verification command (test/build/lint) was run recently
- If not: inject verification reminder into next tool_result

### subagent-driven-development (249 → ~130 lines)

**Stays in skill:**
- Process steps, dispatch instructions, review requirements, red flags (condensed)

**Moves to reference tool:**
- Full example workflow (~60 lines)
- Advantages/cost analysis (~30 lines)
- Detailed "when to use" decision tree description

### dispatching-parallel-agents (184 → ~100 lines)

**Stays in skill:**
- When to use, the pattern (4 steps), agent prompt structure, common mistakes (condensed)

**Moves to reference tool:**
- Real example from session (~40 lines)
- Extended "when NOT to use" section
- Key benefits / real-world impact sections

### using-git-worktrees (217 → ~120 lines)

**Stays in skill:**
- Directory selection process, safety verification, creation steps, integration

**Moves to reference tool:**
- Common mistakes section (~20 lines)
- Full example workflow (~20 lines)
- Quick reference table

### finishing-a-development-branch (202 → ~120 lines)

**Stays in skill:**
- The process (5 steps), option details, red flags

**Moves to reference tool:**
- Quick reference table
- Common mistakes section (~20 lines)

### receiving-code-review (213 → ~100 lines)

Mostly process-oriented, moderate reduction.

### requesting-code-review (111 → ~80 lines)

Already fairly lean. Minor trim.

### writing-plans (118 → ~90 lines)

Already fairly lean. Minor trim.

### executing-plans (86 → ~70 lines)

Already lean. Minimal changes.

### brainstorming (55 → ~55 lines)

Already lean. No changes.

---

## Enforcement Extension Design

### File Structure

```
extensions/
├── workflow-monitor.ts          # Main extension (wiring, events, widget)
├── workflow-monitor/
│   ├── tdd-monitor.ts           # TDD phase tracking + violation detection
│   ├── debug-monitor.ts         # Debugging phase tracking
│   ├── verification-monitor.ts  # Completion claim detection
│   ├── reference-tool.ts        # workflow_reference tool implementation
│   └── heuristics.ts            # File classification (test vs source)
```

### File Classification Heuristics

```typescript
function isTestFile(path: string): boolean {
  // Match common test file patterns
  return /\.(test|spec)\.(ts|js|tsx|jsx|py|rs|go)$/.test(path)
    || /^tests?\//.test(path)
    || /__tests__\//.test(path)
    || /test_\w+\.py$/.test(path);
}

function isSourceFile(path: string): boolean {
  // Source files: not test, not config, not docs
  const ext = /\.(ts|js|tsx|jsx|py|rs|go|java|rb|swift|kt)$/;
  return ext.test(path) && !isTestFile(path);
}
```

These are heuristics — they'll have false positives/negatives. That's fine because the extension warns, it doesn't block. A false positive warning is a minor annoyance; a missed violation is caught by the lean skill's proactive text.

### TDD Monitor

```typescript
interface TddState {
  phase: "idle" | "red" | "green" | "refactor";
  testFilesWritten: Set<string>;
  sourceFilesWritten: Set<string>;
  lastTestRun: { passed: boolean; timestamp: number } | null;
}

// On write/edit tool_result:
//   If test file → record, transition to RED if idle
//   If source file without prior test file → inject warning
//
// On bash tool_result:
//   If looks like test command → parse pass/fail
//   If fail → stay RED (or confirm RED)
//   If pass → transition to GREEN/REFACTOR
//
// Reset cycle after commit (bash with "git commit")
```

### Warning Content

Warnings are not one-liners. They include the relevant anti-rationalization content:

```typescript
const TDD_VIOLATION_WARNING = `
⚠️ TDD VIOLATION: You wrote production code without a failing test first.

The Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.

Delete this code. Write the failing test first. Then implement.

Common rationalizations (all wrong):
- "Too simple to test" → Simple code breaks. Test takes 30 seconds.
- "I'll test after" → Tests written after pass immediately. Proves nothing.
- "Need to explore first" → Fine. Throw away exploration, start with TDD.
- "Deleting this work is wasteful" → Sunk cost fallacy. Keeping unverified code is debt.
`;
```

This is ~10 lines injected at the moment of violation, vs. ~20 lines permanently in context. More targeted, less total context.

### Widget

```typescript
ctx.ui.setWidget("workflow", (tui, theme) => {
  const parts: string[] = [];

  if (tddState.phase !== "idle") {
    const phaseColor = {
      red: "error",
      green: "success",
      refactor: "accent",
    }[tddState.phase];
    parts.push(theme.fg(phaseColor, `TDD: ${tddState.phase.toUpperCase()}`));
  }

  if (debugState.phase > 0) {
    parts.push(theme.fg("warning", `Debug: Phase ${debugState.phase}`));
  }

  return parts.length > 0
    ? new Text(parts.join(theme.fg("dim", "  |  ")), 0, 0)
    : undefined;
});
```

Displayed alongside the plan-tracker widget:

```
TDD: RED  |  Tasks: ✓✓→○○ (2/5)  Task 3: Recovery modes
```

### Reference Tool

```typescript
pi.registerTool({
  name: "workflow_reference",
  label: "Workflow Reference",
  description: "Detailed guidance for workflow skills. Topics: tdd-rationalizations, tdd-anti-patterns, tdd-when-stuck, tdd-examples, debug-rationalizations, debug-tracing, debug-defense-in-depth, verification-failures, verification-rationalizations",
  parameters: Type.Object({
    topic: StringEnum([
      "tdd-rationalizations", "tdd-anti-patterns", "tdd-when-stuck", "tdd-examples",
      "debug-rationalizations", "debug-tracing", "debug-defense-in-depth", "debug-condition-waiting",
      "verification-failures", "verification-rationalizations",
      "review-template", "parallel-example",
    ] as const),
  }),
  async execute(toolCallId, params) {
    // Read from reference files in skill directories
    const content = await loadReference(params.topic);
    return { content: [{ type: "text", text: content }] };
  }
});
```

Each topic maps to a file or section within the existing skill directories. Some reference files already exist (`testing-anti-patterns.md`, `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`). Others need to be extracted from the current SKILL.md files into standalone reference files.

---

## Context Budget Analysis

### Current (pi-superpowers)

| Skill | Lines in context when loaded |
|---|---|
| test-driven-development | 373 |
| systematic-debugging | 298 |
| subagent-driven-development | 249 |
| using-git-worktrees | 217 |
| receiving-code-review | 213 |
| finishing-a-development-branch | 202 |
| dispatching-parallel-agents | 184 |
| verification-before-completion | 139 |
| writing-plans | 118 |
| requesting-code-review | 111 |
| executing-plans | 86 |
| brainstorming | 55 |
| **Total** | **2,245** |

### After (pi-superpowers-plus)

| Skill | Lines in context | Reduction |
|---|---|---|
| test-driven-development | ~130 | 65% |
| systematic-debugging | ~120 | 60% |
| subagent-driven-development | ~130 | 48% |
| using-git-worktrees | ~120 | 45% |
| receiving-code-review | ~100 | 53% |
| finishing-a-development-branch | ~120 | 41% |
| dispatching-parallel-agents | ~100 | 46% |
| verification-before-completion | ~80 | 42% |
| writing-plans | ~90 | 24% |
| requesting-code-review | ~80 | 28% |
| executing-plans | ~70 | 19% |
| brainstorming | ~55 | 0% |
| **Total** | **~1,195** | **47%** |

The reference tool and workflow_reference tool description add ~20 lines to context (tool descriptions in system prompt). Net savings: ~45%.

Enforcement extension warnings are injected only on violation — typically 0-2 times per session. When they fire, they add ~10 lines to that single tool result, then disappear.

---

## Testing Strategy

### Extension Tests

- TDD monitor: file classification, phase transitions, violation detection
- Debug monitor: phase tracking, fix-count detection
- Verification monitor: completion claim detection
- Reference tool: topic loading, missing topic handling
- Widget formatting
- Heuristic edge cases (is `setup.py` a test file? No. Is `test_utils.py`? Yes.)

### Skill Content Tests

Same as pi-superpowers: frontmatter validation, cross-reference checks, file existence.

### Behavioral Tests (new for plus)

Structured tests that verify the lean skills + enforcement are at least as effective as the full skills:

1. Set up a minimal project with a known task
2. Run pi with the skill loaded, give it the task
3. Check: did it follow TDD? Did it verify before claiming done?
4. Compare results between pi-superpowers and pi-superpowers-plus

These are expensive and slow. They run on CI nightly, not on every commit. They're the key validation that the context reduction doesn't degrade quality.

---

## Migration from pi-superpowers

pi-superpowers-plus is a standalone fork, not a layer on top. Users install one or the other:

```bash
# Original (faithful port)
pi install git:github.com/coctostan/pi-superpowers

# Plus (lean skills + enforcement)
pi install git:github.com/coctostan/pi-superpowers-plus
```

Skill names are identical, so they conflict if both are installed. The package description makes this clear.

---

## Package Structure

```
pi-superpowers-plus/
├── package.json
├── README.md
├── LICENSE
├── vitest.config.ts
├── extensions/
│   ├── plan-tracker.ts
│   ├── plan-tracker-core.ts
│   ├── workflow-monitor.ts
│   └── workflow-monitor/
│       ├── tdd-monitor.ts
│       ├── debug-monitor.ts
│       ├── verification-monitor.ts
│       ├── reference-tool.ts
│       └── heuristics.ts
├── skills/
│   ├── brainstorming/
│   │   └── SKILL.md
│   ├── test-driven-development/
│   │   ├── SKILL.md                    # Lean version (~130 lines)
│   │   ├── testing-anti-patterns.md    # Existing reference
│   │   └── reference/
│   │       ├── rationalizations.md     # Extracted from original
│   │       ├── examples.md             # Extracted from original
│   │       └── when-stuck.md           # Extracted from original
│   ├── systematic-debugging/
│   │   ├── SKILL.md                    # Lean version (~120 lines)
│   │   ├── root-cause-tracing.md       # Existing reference
│   │   ├── defense-in-depth.md         # Existing reference
│   │   ├── condition-based-waiting.md  # Existing reference
│   │   ├── condition-based-waiting-example.ts
│   │   ├── find-polluter.sh
│   │   └── reference/
│   │       └── rationalizations.md     # Extracted from original
│   ├── verification-before-completion/
│   │   ├── SKILL.md                    # Lean version (~80 lines)
│   │   └── reference/
│   │       ├── common-failures.md
│   │       └── rationalizations.md
│   └── ... (remaining skills, similar pattern)
├── tests/
│   ├── extension/
│   │   ├── plan-tracker.test.ts
│   │   └── workflow-monitor/
│   │       ├── tdd-monitor.test.ts
│   │       ├── debug-monitor.test.ts
│   │       ├── verification-monitor.test.ts
│   │       ├── heuristics.test.ts
│   │       └── reference-tool.test.ts
│   ├── skills/
│   │   └── skill-validation.test.ts
│   └── behavioral/
│       └── ... (nightly CI tests)
└── docs/
    └── plans/
```

---

## Risks

### False positive warnings

The heuristic file classification will sometimes get it wrong. A write to `src/helpers.ts` that's actually a test utility would trigger a TDD warning. Mitigation: warnings are advisory (injected into tool result, not blocking), and the LLM can reason about whether the warning applies.

### Lean skills too lean

Removing too much proactive content could increase violation rates. Mitigation: behavioral tests compare violation rates between pi-superpowers and pi-superpowers-plus. If plus is worse, add content back to the lean skill until parity is reached.

### Test runner detection

Parsing bash output to determine if tests passed/failed is fragile. Different projects use different runners with different output formats. Mitigation: look for common patterns (exit code, "PASS"/"FAIL", "X passing", "X failed") and default to "unknown" when unsure. Unknown results don't trigger state transitions.

### Complexity budget

The enforcement extension adds real code that needs maintenance. The original approach (just text) has zero runtime complexity. Mitigation: keep the extension focused on the three highest-value monitors (TDD, debugging, verification) and resist expanding to every skill.

---

## Attribution

Skill content adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent, licensed under MIT. Enforcement extension and architectural changes by coctostan.
