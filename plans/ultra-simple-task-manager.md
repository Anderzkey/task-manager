# Task Manager MVP - Ultra Simple Version

## The Absolute Minimum

A task manager that works in your browser. No servers, no database, no login. Just **add tasks, check them off, delete them.**

**Timeline:** 3-5 days (12-20 hours)
**Tech:** Next.js 15 + React 19 + Tailwind CSS + localStorage
**Hosting:** Vercel (free, one-click deploy)

---

## What You're Building

A single page where you can:
- ✅ Type a task and press Enter to add it
- ✅ Click the checkbox to mark it done
- ✅ Click delete to remove it
- ✅ Tasks stay there when you refresh the page (localStorage)

**That's it.**

---

## Database: localStorage (Your Browser)

No server. No database migrations. Tasks live in your browser's localStorage.

```javascript
// Task structure (simple)
{
  id: "task-1",
  title: "Buy milk",
  completed: false,
  createdAt: 1707417600000
}
```

When you refresh the page, your tasks are still there (localStorage persists).

---

## The Code Structure

```
app/
├── layout.tsx           # Root layout + styles
├── page.tsx             # Main task list page
└── lib/
    └── tasks.ts         # localStorage helper functions
```

That's all you need.

---

## Phase 1: Basic Functionality (Days 1-2 / ~8 hours)

### Step 1: Initialize Next.js
```bash
npx create-next-app@latest task-manager --typescript --tailwind
cd task-manager
```

### Step 2: Create localStorage Utilities

Create `lib/tasks.ts`:
```typescript
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
```

### Step 3: Create the Main Page

Replace `app/page.tsx`:
```typescript
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Tasks</h1>
        <p className="text-gray-600 mb-6">Get stuff done</p>

        {/* Add Task Form */}
        <form onSubmit={handleAdd} className="mb-6">
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
```

### Step 4: Update Layout

Update `app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A simple task manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

### Step 5: Test It

```bash
npm run dev
# Open http://localhost:3000
# Add some tasks, refresh the page, tasks are still there ✅
```

---

## Phase 2: Polish & Deploy (Days 3-5 / ~4-8 hours)

### Improvements (Optional)

Add these only if you want:
- [ ] **Drag-and-drop reordering** - Rearrange tasks (use `react-beautiful-dnd`)
- [ ] **Dark mode** - Add theme toggle
- [ ] **Clear all completed** - Quick delete button for checked tasks
- [ ] **Local export** - Download tasks as JSON
- [ ] **Animations** - Smooth add/remove transitions

### Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial commit: ultra simple task manager"
git remote add origin https://github.com/[your-username]/task-manager.git
git push -u origin main
```

Then:
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Select your GitHub repo
4. Click "Deploy"
5. **Done!** Your task manager is live at `task-manager-[random].vercel.app`

---

## What You're NOT Building

❌ User accounts / login
❌ Server-side database
❌ Filtering / sorting
❌ Due dates or priorities
❌ Recurring tasks
❌ Sharing with others
❌ Undo/redo
❌ Multiple task lists
❌ Cloud sync (works offline, but single device)

---

## File Structure (Complete)

```
task-manager/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── tasks.ts
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

That's 3 files you create. Everything else is Next.js defaults.

---

## Success Criteria

- [ ] Add a task → it appears in the list
- [ ] Refresh page → task is still there
- [ ] Click checkbox → task gets strikethrough
- [ ] Click delete → task disappears
- [ ] Input field clears after adding task
- [ ] "No tasks yet" message shows when list is empty
- [ ] Deploy to Vercel → works on the public URL
- [ ] App is responsive on mobile

---

## Real Timeline

| Phase | Time | What You're Doing |
|-------|------|-------------------|
| Setup | 30 min | Create Next.js project, install dependencies |
| Utilities | 30 min | Write localStorage helper functions |
| Main Page | 1.5 hours | Build React component with form + list |
| Testing | 1 hour | Test add/check/delete locally |
| Deploy | 30 min | Push to GitHub, deploy to Vercel |
| Polish (optional) | 2-4 hours | Add drag-and-drop, dark mode, etc. |

**Total:** 4-6 hours to working MVP (plus optional polish)

---

## Next Steps After v1

Once you have a working task manager:

**v1.1 (Add later):**
- [ ] Drag-and-drop reordering
- [ ] Dark mode
- [ ] Export tasks to CSV
- [ ] Keyboard shortcut (Cmd+Enter to save)

**v2.0 (Much later):**
- [ ] Cloud sync (Firebase/Supabase)
- [ ] Mobile app (React Native)
- [ ] Sharing with others
- [ ] Due dates and reminders

---

## Key Advantages of This Approach

✅ **Super fast:** Build in a few hours, not days
✅ **Works offline:** No internet = no problem
✅ **No server costs:** Costs $0 to run
✅ **Learn React fundamentals:** useState, useEffect, localStorage
✅ **Easy to deploy:** One-click Vercel deploy
✅ **Easy to extend:** Add features later without major refactoring
✅ **No authentication complexity:** Just you, your tasks

---

## The Catch

⚠️ **Single device only** - Tasks only sync on the device you use. If you open the app on your phone, it won't see the desktop tasks.

**Fix this later:** Swap localStorage for a backend (Firebase/Supabase) when you want multi-device sync.

---

## Hardest Part: localStorage Hydration

The trickiest part is preventing a "hydration mismatch" error in Next.js. Here's why:

1. Server renders with no tasks (doesn't know localStorage yet)
2. Browser loads, reads localStorage, finds 5 tasks
3. React sees a mismatch → throws error

**Solution:** Check `mounted` state (see code above). Only render after the component loads in the browser.

If you hit this error:
```javascript
// Add this check in your component
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

---

## Ready?

Start with `npm run dev` and build. You'll have a working task manager in a few hours.

After that, decide if you want to:
1. **Keep it simple** - Add polish and ship it
2. **Add features** - Filtering, due dates, dark mode
3. **Scale it up** - Add auth, backend, multi-user

All paths are valid. Ship first, decide later.
