/**
 * Mock Claude Agent
 *
 * Simulates Claude's behavior using pattern matching.
 * Detects user intent (add, complete, delete, list) and decides which tools to use.
 *
 * IMPORTANT: This is a mock for testing. When ready to use real Claude,
 * replace this with lib/claude/realAgent.ts that calls the Anthropic API.
 */

import { getTasks } from '@/lib/tasks';

interface AgentResult {
  response: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
}

/**
 * Mock Claude Response - Pattern matching based agent
 * @param userMessage - Message from the user
 * @returns Agent response with optional tool calls
 */
export async function mockClaudeResponse(userMessage: string): Promise<AgentResult> {
  const message = userMessage.toLowerCase().trim();
  const tasks = getTasks();

  // ===== HELPER FUNCTIONS =====

  /**
   * Extract task title from a message
   * Looks for patterns like: "Add 'Buy milk'" or "Add Buy milk"
   */
  function extractTitle(msg: string): string | null {
    const patterns = [
      // Pattern 1: "add/create 'title'" or "add/create 'title'"
      /(?:add|create)\s+(?:a\s+)?(?:task\s+)?['""]?([^'""\n]+?)['""]?(?:\s|$|\.)/i,
      // Pattern 2: anything in quotes
      /['""]([^'""\n]+?)['""](?:\s|$)/i
    ];

    for (const pattern of patterns) {
      const match = msg.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Find a task by reference (name or index)
   */
  function findTask(reference: string) {
    const ref = reference.toLowerCase();

    // By index
    if (ref.includes('first')) return tasks[0];
    if (ref.includes('last')) return tasks[tasks.length - 1];

    // By name (substring match)
    for (const task of tasks) {
      if (task.title.toLowerCase().includes(ref)) return task;
    }

    return null;
  }

  // ===== INTENT: ADD TASK =====
  if (message.includes('add') || message.includes('create')) {
    const title = extractTitle(userMessage);

    if (title) {
      return {
        response: `✓ I've added "${title}" to your tasks.`,
        toolCalls: [{ name: 'add_task', input: { title } }]
      };
    } else {
      return {
        response:
          "I'd like to add a task, but I need a title. What should the task be called?",
        toolCalls: []
      };
    }
  }

  // ===== INTENT: COMPLETE TASK =====
  if (
    message.includes('complete') ||
    message.includes('done') ||
    message.includes('finish') ||
    message.includes('mark') ||
    message.includes('✓')
  ) {
    if (tasks.length === 0) {
      return {
        response: "You don't have any tasks to complete!",
        toolCalls: []
      };
    }

    // Determine which task to complete
    let taskToComplete = null;

    if (message.includes('first')) {
      taskToComplete = tasks[0];
    } else if (message.includes('last')) {
      taskToComplete = tasks[tasks.length - 1];
    } else {
      // Try to find by name
      const titleMatch = extractTitle(userMessage);
      if (titleMatch) {
        taskToComplete = findTask(titleMatch);
      }
    }

    // If still not found, use first task
    if (!taskToComplete) {
      taskToComplete = tasks[0];
    }

    return {
      response: `✓ Marked "${taskToComplete.title}" as complete.`,
      toolCalls: [{ name: 'complete_task', input: { task_id: taskToComplete.id } }]
    };
  }

  // ===== INTENT: DELETE TASK =====
  if (message.includes('delete') || message.includes('remove')) {
    if (tasks.length === 0) {
      return {
        response: "You don't have any tasks to delete!",
        toolCalls: []
      };
    }

    // Determine which task to delete
    let taskToDelete = null;

    if (message.includes('first')) {
      taskToDelete = tasks[0];
    } else if (message.includes('last')) {
      taskToDelete = tasks[tasks.length - 1];
    } else {
      // Try to find by name
      const titleMatch = extractTitle(userMessage);
      if (titleMatch) {
        taskToDelete = findTask(titleMatch);
      }
    }

    // If still not found, use first task
    if (!taskToDelete) {
      taskToDelete = tasks[0];
    }

    return {
      response: `🗑 Deleted "${taskToDelete.title}".`,
      toolCalls: [{ name: 'delete_task', input: { task_id: taskToDelete.id } }]
    };
  }

  // ===== INTENT: LIST/SHOW TASKS =====
  if (
    message.includes('show') ||
    message.includes('list') ||
    message.includes('what') ||
    message.includes('how many') ||
    message.includes('view') ||
    message.includes('display')
  ) {
    if (tasks.length === 0) {
      return {
        response: "You have no tasks yet. Would you like me to add some?",
        toolCalls: []
      };
    }

    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;

    const taskList = tasks
      .map(t => `${t.completed ? '✓' : '○'} ${t.title}`)
      .join('\n');

    return {
      response: `You have **${tasks.length} tasks** (${pending} pending, ${completed} done):\n\n${taskList}`,
      toolCalls: []
    };
  }

  // ===== DEFAULT RESPONSE =====
  return {
    response:
      "I can help you manage tasks! Try asking me to:\n" +
      "- Add a task (e.g., 'Add Buy milk')\n" +
      "- Complete a task (e.g., 'Mark the first task done')\n" +
      "- Delete a task (e.g., 'Delete that')\n" +
      "- Show my tasks (e.g., 'What tasks do I have?')",
    toolCalls: []
  };
}
