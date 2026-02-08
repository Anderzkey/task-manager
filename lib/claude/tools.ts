/**
 * Claude Tool Definitions
 *
 * These tools define what Claude (or mock Claude) can do.
 * Each tool has:
 * - name: How the tool is called
 * - description: What it does (detailed for Claude)
 * - input_schema: What parameters it accepts (JSON Schema)
 * - input_examples: Example usage (helps Claude understand)
 */

export const TASK_TOOLS = [
  {
    name: "add_task",
    description: "Creates a new task in the task list. Takes a title (required) and returns the newly created task object with a unique ID and creation timestamp. Use this when the user wants to add a new task.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The task title (required, 1-200 characters)"
        }
      },
      required: ["title"],
      additionalProperties: false
    },
    input_examples: [
      { title: "Buy groceries" },
      { title: "Review pull requests" },
      { title: "Write documentation" }
    ]
  },
  {
    name: "complete_task",
    description: "Marks a task as completed by toggling its completion status. Takes a task_id (required) and returns the updated task. Use this when the user indicates they've finished a task.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The unique ID of the task to complete (format: task-{timestamp})"
        }
      },
      required: ["task_id"],
      additionalProperties: false
    },
    input_examples: [{ task_id: "task-1707417600000" }]
  },
  {
    name: "delete_task",
    description: "Permanently removes a task from the task list. Takes a task_id (required) and returns confirmation with the deleted task's title. Use this when the user explicitly wants to delete or remove a task. This action cannot be undone.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The unique ID of the task to delete (format: task-{timestamp})"
        }
      },
      required: ["task_id"],
      additionalProperties: false
    },
    input_examples: [{ task_id: "task-1707417600000" }]
  }
];
