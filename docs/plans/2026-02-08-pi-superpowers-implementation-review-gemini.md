# Review: pi-superpowers Implementation Plan

**Verdict:** ✅ Approved with minor adjustments.

The plan faithfully executes the design docs and provides a solid path to a working package. It correctly handles the mechanical transforms and infrastructure adaptation.

## Critical Adjustments

### 1. Missing Source Repository
**Task 2** assumes `/tmp/pi-github-repos/obra/superpowers` exists.
*   **Action:** Add a preliminary step or check in Task 2 to clone the repository if missing:
    ```bash
    git clone https://github.com/obra/superpowers.git /tmp/pi-github-repos/obra/superpowers
    ```

### 2. Extension State Logic (`plan_tracker.ts`)
**Task 14**, Step 1:
```typescript
if (msg.role !== "toolResult" || msg.toolName !== "plan_tracker") continue;
```
*   **Flag:** Verify the `role` string literal. In many `pi` implementations, the role for a tool output is `"tool_result"` (snake_case) or just `"tool"`. The camelCase `"toolResult"` is suspicious unless explicitly confirmed against `@mariozechner/pi-coding-agent` types.
*   **Action:** Verify the correct enum/literal for tool results in the `pi` API.

## Suggestions

### 3. Plan Tracker Optimization
The `reconstructState` function iterates the *entire* session branch on every `session_switch` or `session_tree` event.
*   **Observation:** For long sessions, this is O(N) and might be slow.
*   **Mitigation:** Acceptable for V1, but consider caching the last known state index if performance becomes an issue later.

### 4. Attribution
**Task 1 & 15**: The plan uses `coctostan` as the author/namespace.
*   **Action:** Ensure this matches your intended git username/namespace for the final push, otherwise `pi install` commands in the README will need updating later.

## Validation
The "Final Verification" (Task 16) is excellent. The grep checks for `CLAUDE.md` and `Task tool` are crucial for ensuring a clean port.
