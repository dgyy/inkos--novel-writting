import type { Message, ToolExecution } from "../../store/chat/types";

const PLAY_TOOLS = new Set(["play_start", "play_step"]);

function actionsFromExecution(exec: ToolExecution): string[] {
  if (!PLAY_TOOLS.has(exec.tool) || exec.status !== "completed") return [];
  const details = exec.details as { suggestedActions?: unknown } | undefined;
  return Array.isArray(details?.suggestedActions)
    ? details.suggestedActions.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
    : [];
}

export function latestPlayChoices(messages: ReadonlyArray<Message>): string[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i]?.parts ?? [];
    for (let p = parts.length - 1; p >= 0; p--) {
      const part = parts[p];
      if (part.type !== "tool") continue;
      const actions = actionsFromExecution(part.execution);
      if (actions.length > 0) return actions;
    }

    // Direct tool executions created by confirmed action buttons may be present
    // on the flat message before they are rehydrated into chronological parts.
    const toolExecutions = messages[i]?.toolExecutions ?? [];
    for (let t = toolExecutions.length - 1; t >= 0; t--) {
      const actions = actionsFromExecution(toolExecutions[t]);
      if (actions.length > 0) return actions;
    }
  }
  return [];
}
