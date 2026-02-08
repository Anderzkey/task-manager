# Code Comparison: Anti-Pattern vs Good Pattern

## Scenario: "Clear all completed tasks"

Let's see how the monolithic anti-pattern vs our good pattern handles this real request.

---

## Anti-Pattern Implementation 🚫

### Tool Definition

```typescript
// One giant tool with 7 different operations
const manageTaskSystem = {
  name: "manage_task_system",
  description: "Manages all aspects of tasks (add, complete, delete, list, filter, stats, archive)",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["add", "complete", "delete", "list", "filter", "stats", "archive"],
        description: "What operation to perform"
      },
      title: {
        type: "string",
        description: "Task title (for add action)"
      },
      task_id: {
        type: "string",
        description: "Task ID (for complete/delete/archive)"
      },
      filter_by: {
        type: "string",
        enum: ["completed", "pending", "all"],
        description: "Filter results by status"
      },
      sort_by: {
        type: "string",
        enum: ["created", "title", "status"],
        description: "Sort results"
      },
      include_archived: {
        type: "boolean",
        description: "Include archived tasks in listing"
      }
    },
    required: ["action"],
    additionalProperties: false
  }
}
```

### Tool Execution

```typescript
// Massive switch statement
async function executeTool(input: Record<string, unknown>) {
  const action = input.action as string;

  switch(action) {
    case 'add': {
      // 20 lines: validate, create, save
      const title = input.title as string;
      if (!title) throw new Error('Title required');
      const task = createTask(title);
      saveTasks([...getTasks(), task]);
      return { success: true, task };
    }

    case 'complete': {
      // 15 lines: validate, update, save
      const taskId = input.task_id as string;
      const tasks = getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Not found');
      task.completed = !task.completed;
      saveTasks(tasks);
      return { success: true, task };
    }

    case 'delete': {
      // 12 lines: validate, delete, save
      const taskId = input.task_id as string;
      const tasks = getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Not found');
      const updated = tasks.filter(t => t.id !== taskId);
      saveTasks(updated);
      return { success: true, deleted: task };
    }

    case 'list': {
      // 25 lines: build filters, sort, format
      let tasks = getTasks();
      const filterBy = input.filter_by as string;
      const sortBy = input.sort_by as string;
      const includeArchived = input.include_archived as boolean;

      if (!includeArchived) {
        tasks = tasks.filter(t => !t.archived);
      }

      if (filterBy === 'completed') {
        tasks = tasks.filter(t => t.completed);
      } else if (filterBy === 'pending') {
        tasks = tasks.filter(t => !t.completed);
      }

      if (sortBy === 'title') {
        tasks.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'created') {
        tasks.sort((a, b) => a.createdAt - b.createdAt);
      }

      return { success: true, tasks, count: tasks.length };
    }

    case 'filter': {
      // 20 lines: custom filtering logic
      // ... similar to list but with more complex filters
    }

    case 'stats': {
      // 12 lines: calculate stats
      const tasks = getTasks();
      return {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed).length
      };
    }

    case 'archive': {
      // 15 lines: archive logic
      // ... marking tasks as archived
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
// Total: ~145 lines in ONE function
```

### How the Agent Uses It (Problematic)

```typescript
// Agent needs to understand the tool's complexity
// For "clear all completed tasks", agent must:

// 1. Figure out which tasks are completed
const step1 = await callTool("manage_task_system", {
  action: "list",
  filter_by: "completed"
});
// Gets back: [task1, task2, task3]

// 2. Delete each one (no bulk delete in monolithic tool!)
for (const task of step1.tasks) {
  await callTool("manage_task_system", {
    action: "delete",
    task_id: task.id
  });
}

// 3. Show remaining tasks
const step3 = await callTool("manage_task_system", {
  action: "list",
  filter_by: "pending"
});

// Result: 5+ API calls just to "clear completed tasks"
// Agent has to manually orchestrate everything
// If filter_by is wrong, tool silently fails
```

### Problems Visible Here

```typescript
// Problem 1: What if agent forgets filter_by?
await callTool("manage_task_system", {
  action: "list"
  // filter_by: omitted!
});
// Returns all tasks - not what agent wanted

// Problem 2: What if agent uses wrong filter_by?
await callTool("manage_task_system", {
  action: "list",
  filter_by: "completed_items"  // typo!
});
// Tool silently ignores it, returns all

// Problem 3: delete doesn't know why it's being called
// Is this part of "clear completed"? Agent deleting manually?
// Tool has no context, just deletes

// Problem 4: What if agent wants completed AND archived?
await callTool("manage_task_system", {
  action: "list",
  filter_by: "completed",    // only supports ONE filter!
  include_archived: true     // can't combine filters
});
// Tool doesn't support combining filters
```

---

## Good Pattern Implementation ✅

### Tool Definitions (Our Code)

```typescript
// lib/claude/tools.ts
export const TASK_TOOLS = [
  {
    name: "add_task",
    description: "Creates a new task in the task list.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The task title (1-200 characters)"
        }
      },
      required: ["title"],
      additionalProperties: false
    },
    input_examples: [
      { title: "Buy groceries" },
      { title: "Review pull requests" }
    ]
  },
  {
    name: "complete_task",
    description: "Marks a task as completed by toggling its completion status.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The unique ID of the task to complete"
        }
      },
      required: ["task_id"],
      additionalProperties: false
    },
    input_examples: [{ task_id: "task-1707417600000" }]
  },
  {
    name: "delete_task",
    description: "Permanently removes a task from the task list.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The unique ID of the task to delete"
        }
      },
      required: ["task_id"],
      additionalProperties: false
    },
    input_examples: [{ task_id: "task-1707417600000" }]
  }
]
// Total: 3 tools, each with ONE job
```

### Tool Execution (Our Code)

```typescript
// app/api/claude/agent/route.ts - simplified
switch (toolCall.name) {
  case 'add_task': {
    const { title } = input;
    if (!title) return { success: false, error: 'Title required' };
    const task = addTaskServer(updatedTasks, title);
    updatedTasks = [task, ...updatedTasks];
    return { success: true, data: task };
  }

  case 'complete_task': {
    const { task_id } = input;
    updatedTasks = toggleTaskServer(updatedTasks, task_id);
    return { success: true, data: updated };
  }

  case 'delete_task': {
    const { task_id } = input;
    updatedTasks = deleteTaskServer(updatedTasks, task_id);
    return { success: true, data: { id: task_id } };
  }
}
// Total: ~30 lines, each case is crystal clear
```

### How the Agent Uses It (Natural)

```typescript
// For "clear all completed tasks", agent's mock logic:

// In mockAgent.ts (lib/claude/mockAgent.ts)
if (message.includes('clear') && message.includes('completed')) {
  // Find completed tasks
  const completedTasks = tasks.filter(t => t.completed);

  if (completedTasks.length === 0) {
    return {
      response: "You don't have any completed tasks to clear.",
      toolCalls: []
    };
  }

  // Create one delete_task call for each
  const toolCalls = completedTasks.map(task => ({
    name: 'delete_task',
    input: { task_id: task.id }
  }));

  return {
    response: `✓ Cleared ${completedTasks.length} tasks. You have ${remaining} remaining.`,
    toolCalls  // Array of 3 delete_task calls
  };
}

// API executes all 3 in parallel:
for (const toolCall of toolCalls) {
  // Calls delete_task 3 times
  // Each one is simple, clear, no confusion
}
```

### Advantages Visible Here

```typescript
// Advantage 1: Clear intent
// delete_task means EXACTLY ONE THING: delete this task

// Advantage 2: Simple error handling
// Each tool can only fail in specific, predictable ways

// Advantage 3: Can call multiple times
// delete_task can be called 1x, 3x, 100x - doesn't matter
// Each call is identical and independent

// Advantage 4: Agent knows EXACTLY what will happen
// delete_task(id) → deletes that task, returns confirmation
// No special cases, no conditional behavior

// Advantage 5: Easy to extend
// Want to archive instead of delete? Create:
// { name: "archive_task", input: { task_id } }
// Zero impact on existing tools
```

---

## Side-by-Side Comparison

| Metric | Anti-Pattern | Good Pattern (Ours) |
|--------|--------------|-------------------|
| **Tools** | 1 giant tool | 3 focused tools |
| **Lines of code** | 145 in one function | 30 lines total |
| **Parameters per tool** | 5-8 | 1-2 |
| **Decision points** | 7 case statements | 3 case statements |
| **Calls needed to "clear completed"** | 5+ API calls | 3 API calls (parallel) |
| **Code to orchestrate** | Manual agent logic | Natural composition |
| **Test cases** | 20+ for one tool | 2-3 per tool |
| **Extendability** | Risk of breaking existing | Safe, isolated |
| **Learning curve** | High (understand all actions) | Low (one job per tool) |

---

## Test Comparison

### Anti-Pattern Tests (20+ tests for ONE tool)

```typescript
describe('manage_task_system', () => {
  describe('add action', () => {
    test('creates task with title', () => { })
    test('fails without title', () => { })
    test('returns created task', () => { })
  })

  describe('complete action', () => {
    test('marks task complete', () => { })
    test('fails without task_id', () => { })
    test('fails with invalid task_id', () => { })
  })

  describe('delete action', () => {
    test('removes task', () => { })
    test('fails without task_id', () => { })
    test('fails with invalid task_id', () => { })
  })

  describe('list action', () => {
    test('returns all tasks', () => { })
    test('filters by completed', () => { })
    test('filters by pending', () => { })
    test('sorts by title', () => { })
    test('sorts by created', () => { })
    test('combines filter and sort', () => { })
    test('excludes archived', () => { })
    test('includes archived', () => { })
  })

  describe('stats action', () => {
    test('returns stats', () => { })
    test('handles empty tasks', () => { })
  })

  // ... more edge cases for each action
})
```

### Good Pattern Tests (Clear & Focused)

```typescript
describe('add_task', () => {
  test('creates task with title', () => { })
  test('fails without title', () => { })
})

describe('complete_task', () => {
  test('marks task complete', () => { })
  test('fails with invalid task_id', () => { })
})

describe('delete_task', () => {
  test('removes task', () => { })
  test('fails with invalid task_id', () => { })
})

// That's it. Crystal clear. Easy to maintain.
```

---

## Conclusion

**What we avoided by using good tool design:**

1. ❌ Confusing parameter combinations
2. ❌ Massive switch statements
3. ❌ Implicit agent orchestration
4. ❌ Hard-to-test monolithic functions
5. ❌ Brittleness when extending

**What we gained:**

1. ✅ Clear, composable tools
2. ✅ Simple, focused code
3. ✅ Natural agent behavior
4. ✅ Easy-to-test components
5. ✅ Safe extensibility

**The proof:** The "clear all completed tasks" feature emerged naturally from simple tools, requiring zero special-case code and zero modification to the tool definitions themselves.
