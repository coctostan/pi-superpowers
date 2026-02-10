/**
 * Plan Tracker Extension
 *
 * A native pi tool for tracking plan progress.
 * State is stored in tool result details for proper branching support.
 * Shows a persistent TUI widget above the editor.
 *
 * Pure logic lives in plan-tracker-core.ts for testability.
 */

import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type, type Static } from "@sinclair/typebox";
import {
  type Task,
  type BranchEntry,
  type PlanTrackerDetails,
  handleInit,
  handleUpdate,
  handleStatus,
  handleClear,
  formatWidgetData,
  reconstructFromBranch,
} from "./plan-tracker-core.js";

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

function renderWidgetText(tasks: Task[], theme: Theme): string {
  const data = formatWidgetData(tasks);
  if (data.total === 0) return "";

  const icons = data.icons
    .map((icon) => {
      switch (icon) {
        case "✓":
          return theme.fg("success", "✓");
        case "→":
          return theme.fg("warning", "→");
        default:
          return theme.fg("dim", "○");
      }
    })
    .join("");

  const currentName = data.currentName ? `  ${data.currentName}` : "";
  return `${theme.fg("muted", "Tasks:")} ${icons} ${theme.fg("muted", `(${data.complete}/${data.total})`)}${currentName}`;
}

export default function (pi: ExtensionAPI) {
  let tasks: Task[] = [];

  const reconstructState = (ctx: ExtensionContext) => {
    tasks = reconstructFromBranch(ctx.sessionManager.getBranch() as BranchEntry[]);
  };

  const updateWidget = (ctx: ExtensionContext) => {
    if (!ctx.hasUI) return;
    if (tasks.length === 0) {
      ctx.ui.setWidget("plan_tracker", undefined);
    } else {
      ctx.ui.setWidget("plan_tracker", (_tui, theme) => {
        return new Text(renderWidgetText(tasks, theme), 0, 0);
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
      let result;

      switch (params.action) {
        case "init": {
          result = handleInit(params.tasks);
          if (!result.error) {
            tasks = result.tasks;
            updateWidget(ctx);
          } else {
            // Preserve existing tasks in details on error (don't destroy active plan)
            result = { ...result, tasks: [...tasks] };
          }
          break;
        }
        case "update": {
          result = handleUpdate(tasks, params.index, params.status);
          tasks = result.tasks;
          updateWidget(ctx);
          break;
        }
        case "status": {
          result = handleStatus(tasks);
          break;
        }
        case "clear": {
          result = handleClear(tasks);
          tasks = result.tasks;
          updateWidget(ctx);
          break;
        }
        default:
          return {
            content: [{ type: "text", text: `Unknown action: ${params.action}` }],
            details: {
              action: "status",
              tasks: [...tasks],
              error: "unknown action",
            } as PlanTrackerDetails,
          };
      }

      const details: PlanTrackerDetails = {
        action: params.action,
        tasks: result.tasks,
        ...(result.error ? { error: result.error } : {}),
      };

      return {
        content: [{ type: "text", text: result.text }],
        details,
      };
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
