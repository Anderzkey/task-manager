/**
 * Tool Execution Handler
 *
 * This file handles executing the three tools:
 * - add_task: Creates a new task
 * - complete_task: Marks a task as done
 * - delete_task: Removes a task
 *
 * Each function wraps the existing localStorage functions from @/lib/tasks
 */

import { Task, getTasks, addTask, toggleTask, deleteTask } from '@/lib/tasks';

type ToolName = 'add_task' | 'complete_task' | 'delete_task';
type ToolInput = Record<string, unknown>;

interface ToolResult {
  success: boolean;
  data?: Task | { title: string; id: string };
  error?: string;
}

/**
 * Execute a tool with the given input
 * @param toolName - Name of the tool to execute
 * @param toolInput - Input parameters for the tool
 * @returns Result object with success status and data or error
 */
export async function executeTool(
  toolName: ToolName,
  toolInput: ToolInput
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'add_task': {
        const { title } = toolInput;

        // Validate title
        if (!title || typeof title !== 'string') {
          return {
            success: false,
            error: 'Title is required and must be a string'
          };
        }

        // Add task using existing function
        const task = addTask(title);
        return { success: true, data: task };
      }

      case 'complete_task': {
        const { task_id } = toolInput;

        // Validate task_id
        if (!task_id || typeof task_id !== 'string') {
          return {
            success: false,
            error: 'Task ID is required and must be a string'
          };
        }

        // Check if task exists
        const tasks = getTasks();
        const task = tasks.find(t => t.id === task_id);
        if (!task) {
          return {
            success: false,
            error: `Task with ID '${task_id}' not found`
          };
        }

        // Toggle completion status
        toggleTask(task_id);
        const updatedTasks = getTasks();
        const updatedTask = updatedTasks.find(t => t.id === task_id);

        return { success: true, data: updatedTask };
      }

      case 'delete_task': {
        const { task_id } = toolInput;

        // Validate task_id
        if (!task_id || typeof task_id !== 'string') {
          return {
            success: false,
            error: 'Task ID is required and must be a string'
          };
        }

        // Check if task exists
        const tasks = getTasks();
        const task = tasks.find(t => t.id === task_id);
        if (!task) {
          return {
            success: false,
            error: `Task with ID '${task_id}' not found`
          };
        }

        // Delete the task
        deleteTask(task_id);

        // Return confirmation with deleted task info
        return {
          success: true,
          data: { title: task.title, id: task.id }
        };
      }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
