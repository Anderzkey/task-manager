export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'tasks';

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(title: string): Task {
  const task: Task = {
    id: `task-${Date.now()}`,
    title,
    completed: false,
    createdAt: Date.now()
  };
  const tasks = getTasks();
  saveTasks([task, ...tasks]);
  return task;
}

export function toggleTask(id: string): void {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks(tasks);
  }
}

export function deleteTask(id: string): void {
  const tasks = getTasks();
  saveTasks(tasks.filter(t => t.id !== id));
}
