'use client';

import { useEffect, useState } from 'react';
import { Task, getTasks, addTask, toggleTask, deleteTask } from '@/lib/tasks';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    setTasks(getTasks());
    setMounted(true);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newTask = addTask(input);
    setTasks([newTask, ...tasks]);
    setInput('');
  };

  const handleToggle = (id: string) => {
    toggleTask(id);
    setTasks(getTasks());
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    setTasks(getTasks());
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tasks</h1>
            <p className="text-gray-600">Get stuff done</p>
          </div>
          <a
            href="/agent"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium whitespace-nowrap"
            title="Chat with Claude to manage tasks"
          >
            💬 Chat
          </a>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAdd} className="mb-6 mt-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Add
            </button>
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tasks yet. Add one above!</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task.id)}
                  className="w-5 h-5 cursor-pointer accent-blue-600"
                />
                <span
                  className={`flex-1 text-lg ${
                    task.completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {tasks.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            {tasks.filter(t => !t.completed).length} of {tasks.length} tasks left
          </div>
        )}
      </div>
    </main>
  );
}
