/**
 * Plan Tracker Core Logic
 *
 * Pure functions extracted from the plan-tracker extension for testability.
 * No pi dependencies — operates on plain data types.
 */

export type TaskStatus = "pending" | "in_progress" | "complete";

export interface Task {
  name: string;
  status: TaskStatus;
}

export interface PlanTrackerDetails {
  action: "init" | "update" | "status" | "clear";
  tasks: Task[];
  error?: string;
}

export interface ActionResult {
  text: string;
  tasks: Task[];
  error?: string;
}

// --- Action Handlers ---

export function handleInit(taskNames: string[] | undefined): ActionResult {
  if (!taskNames || taskNames.length === 0) {
    return {
      text: "Error: tasks array required for init",
      tasks: [],
      error: "tasks required",
    };
  }
  const tasks: Task[] = taskNames.map((name) => ({ name, status: "pending" as TaskStatus }));
  return {
    text: `Plan initialized with ${tasks.length} tasks.\n${formatStatus(tasks)}`,
    tasks,
  };
}

export function handleUpdate(
  tasks: Task[],
  index: number | undefined,
  status: TaskStatus | undefined
): ActionResult {
  if (index === undefined || !status) {
    return {
      text: "Error: index and status required for update",
      tasks: [...tasks],
      error: "index and status required",
    };
  }
  if (tasks.length === 0) {
    return {
      text: "Error: no plan active. Use init first.",
      tasks: [],
      error: "no plan active",
    };
  }
  if (index < 0 || index >= tasks.length) {
    return {
      text: `Error: index ${index} out of range (0-${tasks.length - 1})`,
      tasks: [...tasks],
      error: `index ${index} out of range`,
    };
  }
  const updated = tasks.map((t, i) => (i === index ? { ...t, status } : { ...t }));
  return {
    text: `Task ${index} "${updated[index].name}" → ${status}\n${formatStatus(updated)}`,
    tasks: updated,
  };
}

export function handleStatus(tasks: Task[]): ActionResult {
  return {
    text: formatStatus(tasks),
    tasks: [...tasks],
  };
}

export function handleClear(tasks: Task[]): ActionResult {
  const count = tasks.length;
  return {
    text: count > 0 ? `Plan cleared (${count} tasks removed).` : "No plan was active.",
    tasks: [],
  };
}

// --- Formatting ---

export function formatStatus(tasks: Task[]): string {
  if (tasks.length === 0) return "No plan active.";

  const complete = tasks.filter((t) => t.status === "complete").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;

  const lines: string[] = [];
  lines.push(`Plan: ${complete}/${tasks.length} complete (${inProgress} in progress, ${pending} pending)`);
  lines.push("");
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const icon = t.status === "complete" ? "✓" : t.status === "in_progress" ? "→" : "○";
    lines.push(`  ${icon} [${i}] ${t.name}`);
  }
  return lines.join("\n");
}

export interface WidgetData {
  icons: string[];
  complete: number;
  total: number;
  currentName: string;
}

export function formatWidgetData(tasks: Task[]): WidgetData {
  if (tasks.length === 0) {
    return { icons: [], complete: 0, total: 0, currentName: "" };
  }

  const complete = tasks.filter((t) => t.status === "complete").length;
  const icons = tasks.map((t) => {
    switch (t.status) {
      case "complete":
        return "✓";
      case "in_progress":
        return "→";
      default:
        return "○";
    }
  });

  const current =
    tasks.find((t) => t.status === "in_progress") ??
    tasks.find((t) => t.status === "pending");
  const currentName = current ? current.name : "";

  return { icons, complete, total: tasks.length, currentName };
}

// --- State Reconstruction ---

/**
 * Minimal shape of a branch entry for reconstruction.
 * Matches the subset of fields we need from the pi session branch.
 */
export interface BranchEntry {
  type: string;
  message?: {
    role: string;
    toolName?: string;
    details?: PlanTrackerDetails;
  };
}

export function reconstructFromBranch(entries: BranchEntry[]): Task[] {
  let tasks: Task[] = [];
  for (const entry of entries) {
    if (entry.type !== "message") continue;
    const msg = entry.message;
    if (!msg || msg.role !== "toolResult" || msg.toolName !== "plan_tracker") continue;
    const details = msg.details as PlanTrackerDetails | undefined;
    if (details && !details.error) {
      tasks = details.tasks;
    }
  }
  return tasks;
}
