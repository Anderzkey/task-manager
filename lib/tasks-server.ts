/**
 * Server-side Task Operations
 *
 * These functions work with task data passed from the client,
 * without relying on browser localStorage.
 * Used by API routes that execute tool calls.
 */

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

/**
 * Add a new task to a task list
 */
export function addTaskServer(tasks: Task[], title: string): { task: Task; tasks: Task[] } {
  const task: Task = {
    id: `task-${Date.now()}`,
    title,
    completed: false,
    createdAt: Date.now()
  };
  const updatedTasks = [task, ...tasks];
  return { task, tasks: updatedTasks };
}

/**
 * Toggle completion status of a task
 */
export function toggleTaskServer(tasks: Task[], taskId: string): Task[] {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
  }
  return tasks;
}

/**
 * Delete a task from the list
 */
export function deleteTaskServer(tasks: Task[], taskId: string): Task[] {
  return tasks.filter(t => t.id !== taskId);
}
