import { describe, test, expect } from "vitest";
import {
  handleInit,
  handleUpdate,
  handleStatus,
  handleClear,
  formatStatus,
  formatWidgetData,
  reconstructFromBranch,
  type Task,
  type BranchEntry,
} from "../../extensions/plan-tracker-core.js";

// --- Action Handlers ---

describe("handleInit", () => {
  test("creates tasks from string array, all pending", () => {
    const result = handleInit(["Task A", "Task B", "Task C"]);
    expect(result.error).toBeUndefined();
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0]).toEqual({ name: "Task A", status: "pending" });
    expect(result.tasks[1]).toEqual({ name: "Task B", status: "pending" });
    expect(result.tasks[2]).toEqual({ name: "Task C", status: "pending" });
  });

  test("returns error when tasks array is empty", () => {
    const result = handleInit([]);
    expect(result.error).toBe("tasks required");
    expect(result.tasks).toEqual([]);
  });

  test("returns error when tasks is undefined", () => {
    const result = handleInit(undefined);
    expect(result.error).toBe("tasks required");
    expect(result.tasks).toEqual([]);
  });
});

describe("handleUpdate", () => {
  const baseTasks: Task[] = [
    { name: "Task A", status: "pending" },
    { name: "Task B", status: "pending" },
    { name: "Task C", status: "pending" },
  ];

  test("sets task status to complete", () => {
    const result = handleUpdate(baseTasks, 1, "complete");
    expect(result.error).toBeUndefined();
    expect(result.tasks[1].status).toBe("complete");
    // other tasks unchanged
    expect(result.tasks[0].status).toBe("pending");
    expect(result.tasks[2].status).toBe("pending");
  });

  test("sets task status to in_progress", () => {
    const result = handleUpdate(baseTasks, 0, "in_progress");
    expect(result.error).toBeUndefined();
    expect(result.tasks[0].status).toBe("in_progress");
  });

  test("sets task status back to pending", () => {
    const tasks: Task[] = [{ name: "Task A", status: "complete" }];
    const result = handleUpdate(tasks, 0, "pending");
    expect(result.error).toBeUndefined();
    expect(result.tasks[0].status).toBe("pending");
  });

  test("does not mutate the original tasks array", () => {
    const original: Task[] = [{ name: "Task A", status: "pending" }];
    handleUpdate(original, 0, "complete");
    expect(original[0].status).toBe("pending");
  });

  test("returns error when no plan active", () => {
    const result = handleUpdate([], 0, "complete");
    expect(result.error).toBe("no plan active");
  });

  test("returns error when index out of range (negative)", () => {
    const result = handleUpdate(baseTasks, -1, "complete");
    expect(result.error).toBe("index -1 out of range");
  });

  test("returns error when index out of range (too high)", () => {
    const result = handleUpdate(baseTasks, 5, "complete");
    expect(result.error).toBe("index 5 out of range");
  });

  test("returns error when index is undefined", () => {
    const result = handleUpdate(baseTasks, undefined, "complete");
    expect(result.error).toBe("index and status required");
  });

  test("returns error when status is undefined", () => {
    const result = handleUpdate(baseTasks, 0, undefined);
    expect(result.error).toBe("index and status required");
  });
});

describe("handleStatus", () => {
  test("returns formatted status with counts", () => {
    const tasks: Task[] = [
      { name: "Task A", status: "complete" },
      { name: "Task B", status: "in_progress" },
      { name: "Task C", status: "pending" },
    ];
    const result = handleStatus(tasks);
    expect(result.error).toBeUndefined();
    expect(result.text).toContain("1/3 complete");
    expect(result.text).toContain("1 in progress");
    expect(result.text).toContain("1 pending");
  });

  test('returns "no plan active" when empty', () => {
    const result = handleStatus([]);
    expect(result.text).toBe("No plan active.");
  });
});

describe("handleClear", () => {
  test("returns cleared message with count", () => {
    const tasks: Task[] = [
      { name: "A", status: "pending" },
      { name: "B", status: "complete" },
    ];
    const result = handleClear(tasks);
    expect(result.text).toBe("Plan cleared (2 tasks removed).");
    expect(result.tasks).toEqual([]);
  });

  test('returns "no plan was active" when already empty', () => {
    const result = handleClear([]);
    expect(result.text).toBe("No plan was active.");
    expect(result.tasks).toEqual([]);
  });
});

// --- Formatting ---

describe("formatStatus", () => {
  test("shows complete/total counts", () => {
    const tasks: Task[] = [
      { name: "A", status: "complete" },
      { name: "B", status: "pending" },
    ];
    const output = formatStatus(tasks);
    expect(output).toContain("1/2 complete");
  });

  test("shows icon per task", () => {
    const tasks: Task[] = [
      { name: "Done", status: "complete" },
      { name: "Working", status: "in_progress" },
      { name: "Todo", status: "pending" },
    ];
    const output = formatStatus(tasks);
    expect(output).toContain("✓ [0] Done");
    expect(output).toContain("→ [1] Working");
    expect(output).toContain("○ [2] Todo");
  });

  test("handles all-complete", () => {
    const tasks: Task[] = [
      { name: "A", status: "complete" },
      { name: "B", status: "complete" },
    ];
    const output = formatStatus(tasks);
    expect(output).toContain("2/2 complete");
    expect(output).toContain("0 in progress");
    expect(output).toContain("0 pending");
  });

  test("handles all-pending", () => {
    const tasks: Task[] = [
      { name: "A", status: "pending" },
      { name: "B", status: "pending" },
    ];
    const output = formatStatus(tasks);
    expect(output).toContain("0/2 complete");
  });

  test("handles mixed states", () => {
    const tasks: Task[] = [
      { name: "A", status: "complete" },
      { name: "B", status: "in_progress" },
      { name: "C", status: "pending" },
      { name: "D", status: "complete" },
    ];
    const output = formatStatus(tasks);
    expect(output).toContain("2/4 complete");
    expect(output).toContain("1 in progress");
    expect(output).toContain("1 pending");
  });

  test("returns no plan active for empty list", () => {
    expect(formatStatus([])).toBe("No plan active.");
  });
});

describe("formatWidgetData", () => {
  test("returns icons string, counts, current task name", () => {
    const tasks: Task[] = [
      { name: "A", status: "complete" },
      { name: "B", status: "in_progress" },
      { name: "C", status: "pending" },
    ];
    const data = formatWidgetData(tasks);
    expect(data.icons).toEqual(["✓", "→", "○"]);
    expect(data.complete).toBe(1);
    expect(data.total).toBe(3);
    expect(data.currentName).toBe("B");
  });

  test("current task is first in_progress", () => {
    const tasks: Task[] = [
      { name: "A", status: "complete" },
      { name: "B", status: "in_progress" },
      { name: "C", status: "in_progress" },
    ];
    const data = formatWidgetData(tasks);
    expect(data.currentName).toBe("B");
  });

  test("current task falls back to first pending", () => {
    const tasks: Task[] = [
      { name: "A", status: "complete" },
      { name: "B", status: "pending" },
      { name: "C", status: "pending" },
    ];
    const data = formatWidgetData(tasks);
    expect(data.currentName).toBe("B");
  });

  test("returns empty when no tasks", () => {
    const data = formatWidgetData([]);
    expect(data.icons).toEqual([]);
    expect(data.complete).toBe(0);
    expect(data.total).toBe(0);
    expect(data.currentName).toBe("");
  });

  test("currentName empty when all complete", () => {
    const tasks: Task[] = [
      { name: "A", status: "complete" },
      { name: "B", status: "complete" },
    ];
    const data = formatWidgetData(tasks);
    expect(data.currentName).toBe("");
  });
});

// --- State Reconstruction ---

describe("reconstructFromBranch", () => {
  test("returns empty when no plan_tracker entries", () => {
    const entries: BranchEntry[] = [
      { type: "message", message: { role: "user" } },
      { type: "message", message: { role: "assistant" } },
    ];
    expect(reconstructFromBranch(entries)).toEqual([]);
  });

  test("returns latest task state from multiple entries", () => {
    const entries: BranchEntry[] = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "init",
            tasks: [
              { name: "A", status: "pending" },
              { name: "B", status: "pending" },
            ],
          },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "update",
            tasks: [
              { name: "A", status: "complete" },
              { name: "B", status: "pending" },
            ],
          },
        },
      },
    ];
    const tasks = reconstructFromBranch(entries);
    expect(tasks[0].status).toBe("complete");
    expect(tasks[1].status).toBe("pending");
  });

  test("ignores entries with errors", () => {
    const entries: BranchEntry[] = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "init",
            tasks: [{ name: "A", status: "pending" }],
          },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "update",
            tasks: [{ name: "A", status: "pending" }],
            error: "index out of range",
          },
        },
      },
    ];
    const tasks = reconstructFromBranch(entries);
    // Should still have the init state, error entry ignored
    expect(tasks).toEqual([{ name: "A", status: "pending" }]);
  });

  test("ignores non-plan_tracker entries", () => {
    const entries: BranchEntry[] = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "other_tool",
          details: { action: "init", tasks: [{ name: "X", status: "pending" }] },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "init",
            tasks: [{ name: "A", status: "pending" }],
          },
        },
      },
    ];
    const tasks = reconstructFromBranch(entries);
    expect(tasks).toEqual([{ name: "A", status: "pending" }]);
  });

  test("handles init followed by updates", () => {
    const entries: BranchEntry[] = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "init",
            tasks: [
              { name: "A", status: "pending" },
              { name: "B", status: "pending" },
              { name: "C", status: "pending" },
            ],
          },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "update",
            tasks: [
              { name: "A", status: "in_progress" },
              { name: "B", status: "pending" },
              { name: "C", status: "pending" },
            ],
          },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "update",
            tasks: [
              { name: "A", status: "complete" },
              { name: "B", status: "in_progress" },
              { name: "C", status: "pending" },
            ],
          },
        },
      },
    ];
    const tasks = reconstructFromBranch(entries);
    expect(tasks[0]).toEqual({ name: "A", status: "complete" });
    expect(tasks[1]).toEqual({ name: "B", status: "in_progress" });
    expect(tasks[2]).toEqual({ name: "C", status: "pending" });
  });

  test("handles clear (returns empty)", () => {
    const entries: BranchEntry[] = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "init",
            tasks: [{ name: "A", status: "pending" }],
          },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "clear",
            tasks: [],
          },
        },
      },
    ];
    const tasks = reconstructFromBranch(entries);
    expect(tasks).toEqual([]);
  });

  test("ignores non-message entries", () => {
    const entries: BranchEntry[] = [
      { type: "system" },
      { type: "config" },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "plan_tracker",
          details: {
            action: "init",
            tasks: [{ name: "A", status: "pending" }],
          },
        },
      },
    ];
    const tasks = reconstructFromBranch(entries);
    expect(tasks).toEqual([{ name: "A", status: "pending" }]);
  });
});
