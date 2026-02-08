# Add Claude Tools & Agent (Mock Version) - Implementation Plan

## Overview

Build an AI agent interface with **mock Claude** (no real API needed):
1. Create **three Claude tool definitions** (`add_task`, `complete_task`, `delete_task`)
2. Build a **mock Claude agent** that simulates responses
3. Create a **chat interface** to test the agent
4. Keep it **easy to swap** the mock for real Claude API later

**Timeline:** 1-2 days (5-8 hours)
**Scope:** Tools + agent chat interface with mocks
**Tech:** Next.js, TypeScript, localStorage (existing), no external APIs

---

## Problem Statement

You want to:
- Test the agent architecture without API costs
- Build the UI and flows first
- Swap in real Claude API later when ready

The solution: **Mock Claude** that simulates intelligent responses locally.

---

## Proposed Solution

### Architecture

```
User → Agent Chat Interface
  ↓
Mock Claude (simulates responses)
  ↓
Decides which tools to use
  ↓
Tool Execution (add_task, complete_task, delete_task)
  ↓
localStorage updates
  ↓
Claude response displayed to user
  ↓
All runs locally, no API calls
```

### How Mock Claude Works

The mock analyzes user messages to:
1. **Detect intent** - What does user want? (add, complete, delete, list)
2. **Extract parameters** - What task? Which ID?
3. **Call tools** - Execute add_task, complete_task, etc.
4. **Generate response** - Respond naturally to user

**Examples:**

| User Says | Mock Claude Does | Response |
|-----------|------------------|----------|
| "Add a task: Buy milk" | Calls `add_task({title: "Buy milk"})` | "Done! I've added 'Buy milk'" |
| "Mark the first task done" | Calls `complete_task({task_id: "..."})` | "Marked as complete!" |
| "Delete that task" | Calls `delete_task({task_id: "..."})` | "Deleted!" |
| "Show my tasks" | No tool call, reads getTasks() | "You have 3 tasks: ..." |

---

## Technical Considerations

### Mock vs Real API

**Mock Claude (Now):**
- ✅ Runs locally
- ✅ No API key needed
- ✅ Instant responses
- ✅ No costs
- ❌ Limited understanding (pattern matching)
- ❌ Can't handle complex requests

**Real Claude API (Later):**
- ❌ Needs API key
- ❌ Network latency
- ✅ Real intelligence
- ✅ Handles complex requests
- ✅ Unlimited flexibility

### Swapping Mock for Real

Only **one file changes**:
```typescript
// app/api/claude/agent/route.ts

// BEFORE (Mock):
import { mockClaudeResponse } from '@/lib/claude/mockAgent';
const result = await mockClaudeResponse(message);

// AFTER (Real API):
import { realClaudeResponse } from '@/lib/claude/realAgent';
const result = await realClaudeResponse(message);
```

Same input/output format, so rest of code unchanged.

---

## Acceptance Criteria

### Functional Requirements

- [ ] **Mock agent understands basic intents**
  - Add task: "Add X" → creates task
  - Complete task: "Mark X done" → completes task
  - Delete task: "Delete X" → removes task
  - List tasks: "Show tasks" → displays list

- [ ] **Tools execute correctly**
  - Tasks stored in localStorage
  - Tool results reflected in UI
  - Chat shows confirmation

- [ ] **Chat interface works**
  - User can type messages
  - Mock responds naturally
  - Chat history displayed
  - Responsive layout

### Quality Requirements

- [ ] No console errors
- [ ] Tool definitions are clear
- [ ] Easy to swap mock for real API later
- [ ] Code is well-commented
- [ ] UI is clean and simple

---

## Implementation Phases

### Phase 1: Tool Definitions & Mock Agent (3-4 hours)

#### 1.1 Create Tool Definitions File

Create `lib/claude/tools.ts`:
```typescript
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
    input_examples: [
      { task_id: "task-1707417600000" }
    ]
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
    input_examples: [
      { task_id: "task-1707417600000" }
    ]
  }
];
```

#### 1.2 Create Tool Handler

Create `lib/claude/executeTools.ts`:
```typescript
import { Task, getTasks, addTask, toggleTask, deleteTask } from '@/lib/tasks';

type ToolName = 'add_task' | 'complete_task' | 'delete_task';
type ToolInput = Record<string, unknown>;

interface ToolResult {
  success: boolean;
  data?: Task | { title: string; id: string };
  error?: string;
}

export async function executeTool(
  toolName: ToolName,
  toolInput: ToolInput
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'add_task': {
        const { title } = toolInput;
        if (!title || typeof title !== 'string') {
          return { success: false, error: 'Title is required and must be a string' };
        }
        const task = addTask(title);
        return { success: true, data: task };
      }

      case 'complete_task': {
        const { task_id } = toolInput;
        if (!task_id || typeof task_id !== 'string') {
          return { success: false, error: 'Task ID is required' };
        }
        toggleTask(task_id);
        const tasks = getTasks();
        const task = tasks.find(t => t.id === task_id);
        if (!task) {
          return { success: false, error: `Task not found` };
        }
        return { success: true, data: task };
      }

      case 'delete_task': {
        const { task_id } = toolInput;
        if (!task_id || typeof task_id !== 'string') {
          return { success: false, error: 'Task ID is required' };
        }
        const tasks = getTasks();
        const task = tasks.find(t => t.id === task_id);
        if (!task) {
          return { success: false, error: `Task not found` };
        }
        deleteTask(task_id);
        return { success: true, data: { title: task.title, id: task.id } };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

#### 1.3 Create Mock Claude Agent

Create `lib/claude/mockAgent.ts`:
```typescript
import { getTasks, addTask as addTaskFn } from '@/lib/tasks';
import { executeTool } from './executeTools';

interface AgentResult {
  response: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
}

/**
 * Mock Claude Agent - Simulates Claude's behavior locally
 * Pattern matches user intent and decides which tools to use
 */
export async function mockClaudeResponse(userMessage: string): Promise<AgentResult> {
  const message = userMessage.toLowerCase().trim();
  const tasks = getTasks();

  // Helper: Extract task title from message
  function extractTitle(msg: string): string | null {
    // Try patterns like: "add/create task 'Buy milk'" or "add/create Buy milk"
    const patterns = [
      /(?:add|create)\s+(?:a\s+)?(?:task\s+)?['""]?([^'""\n]+?)['""]?(?:\s|$|\.)/i,
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

  // Helper: Find task by name or index
  function findTask(reference: string) {
    const ref = reference.toLowerCase();

    // By index: "first task", "task 1"
    if (ref.includes('first')) return tasks[0];
    if (ref.includes('last')) return tasks[tasks.length - 1];

    // By name: "task named X"
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
        response: "I'd like to add a task, but I need a title. What should the task be called?",
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

    // Extract which task
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
      } else {
        // Use first task
        taskToComplete = tasks[0];
      }
    }

    if (taskToComplete) {
      return {
        response: `✓ Marked "${taskToComplete.title}" as complete.`,
        toolCalls: [{ name: 'complete_task', input: { task_id: taskToComplete.id } }]
      };
    }
  }

  // ===== INTENT: DELETE TASK =====
  if (message.includes('delete') || message.includes('remove')) {
    if (tasks.length === 0) {
      return {
        response: "You don't have any tasks to delete!",
        toolCalls: []
      };
    }

    let taskToDelete = null;
    if (message.includes('first')) {
      taskToDelete = tasks[0];
    } else if (message.includes('last')) {
      taskToDelete = tasks[tasks.length - 1];
    } else {
      const titleMatch = extractTitle(userMessage);
      if (titleMatch) {
        taskToDelete = findTask(titleMatch);
      } else {
        taskToDelete = tasks[0];
      }
    }

    if (taskToDelete) {
      return {
        response: `🗑 Deleted "${taskToDelete.title}".`,
        toolCalls: [{ name: 'delete_task', input: { task_id: taskToDelete.id } }]
      };
    }
  }

  // ===== INTENT: LIST/SHOW TASKS =====
  if (
    message.includes('show') ||
    message.includes('list') ||
    message.includes('what') ||
    message.includes('how many') ||
    message.includes('view')
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
      "- Complete a task (e.g., 'Mark done')\n" +
      "- Delete a task (e.g., 'Delete that')\n" +
      "- Show my tasks (e.g., 'What tasks do I have?')",
    toolCalls: []
  };
}
```

#### 1.4 Create API Route for Tool Execution

Create `app/api/claude/tools/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { executeTool } from '@/lib/claude/executeTools';

export async function POST(request: NextRequest) {
  try {
    const { tool_name, tool_input } = await request.json();

    if (!tool_name || !tool_input) {
      return NextResponse.json(
        { error: 'Missing tool_name or tool_input' },
        { status: 400 }
      );
    }

    const result = await executeTool(
      tool_name as string,
      tool_input as Record<string, unknown>
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute tool' },
      { status: 500 }
    );
  }
}
```

#### 1.5 Create Agent API Route

Create `app/api/claude/agent/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { mockClaudeResponse } from '@/lib/claude/mockAgent';
import { executeTool } from '@/lib/claude/executeTools';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get mock Claude's response
    const { response, toolCalls } = await mockClaudeResponse(message);

    // Execute any tools the mock decided to use
    const toolResults = [];
    for (const toolCall of toolCalls) {
      const result = await executeTool(
        toolCall.name as 'add_task' | 'complete_task' | 'delete_task',
        toolCall.input
      );
      toolResults.push({ toolName: toolCall.name, result });
    }

    return NextResponse.json({
      response,
      toolCalls,
      toolResults
    });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

---

### Phase 2: Chat Interface (2-3 hours)

#### 2.1 Create Agent Page

Create `app/agent/page.tsx`:
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/claude/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Task Assistant</h1>
          <p className="text-gray-600">Chat with Claude to manage your tasks</p>
          <p className="text-sm text-gray-500 mt-1">(Mock - no API key needed)</p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 rounded-lg bg-white p-4 shadow-sm">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="font-medium">Start by asking me to help with tasks:</p>
              <ul className="text-sm mt-4 space-y-1">
                <li>📝 "Add a task: Buy milk"</li>
                <li>✓ "Mark the first task done"</li>
                <li>🗑 "Delete that task"</li>
                <li>📋 "Show my tasks"</li>
              </ul>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                <p className="text-sm">Mock Claude is thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me to add, complete, or delete tasks..."
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
```

#### 2.2 Update Main Page with Navigation

Update `app/page.tsx` to add link to agent:
```typescript
// Add this to the header area
<nav className="mb-6">
  <a
    href="/agent"
    className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
  >
    💬 Talk to Claude
  </a>
</nav>
```

---

## Success Metrics

### Functional
- [ ] Mock Claude understands basic commands
- [ ] Tools execute and update localStorage
- [ ] Chat interface shows messages
- [ ] Tasks persist between page reloads

### Testing Checklist

```
1. Add a task
   User: "Add a task called Buy milk"
   → Task appears in main task manager

2. List tasks
   User: "Show my tasks"
   → Claude lists all tasks with count

3. Complete a task
   User: "Mark the first task done"
   → Task shows strikethrough in task manager

4. Delete a task
   User: "Delete that task"
   → Task removed from list

5. Multiple operations
   User: "Add task: Task 1, then add task: Task 2"
   → Both tasks created

6. Error handling
   User: (with no tasks) "Mark a task done"
   → Claude responds appropriately
```

### Quality
- [ ] No console errors
- [ ] Chat is responsive and smooth
- [ ] Messages display correctly
- [ ] UI is clean and intuitive

---

## File Structure Created

```
lib/claude/
├── tools.ts              # Tool definitions
├── executeTools.ts       # Tool execution handlers
└── mockAgent.ts          # Mock Claude (pattern matching)

app/api/claude/
├── tools/route.ts        # Tool execution API
└── agent/route.ts        # Agent message API

app/
└── agent/page.tsx        # Chat interface
```

---

## How to Swap Mock for Real API Later

When ready to use real Claude:

1. **Install SDK:**
   ```bash
   npm install @anthropic-ai/sdk
   ```

2. **Create `lib/claude/realAgent.ts`:**
   ```typescript
   import Anthropic from '@anthropic-ai/sdk';

   const client = new Anthropic({
     apiKey: process.env.ANTHROPIC_API_KEY
   });

   export async function realClaudeResponse(userMessage: string) {
     // ... call client.messages.create() ...
   }
   ```

3. **Update `app/api/claude/agent/route.ts`:**
   ```typescript
   // Change this line:
   // import { mockClaudeResponse } from '@/lib/claude/mockAgent';

   // To this:
   import { realClaudeResponse } from '@/lib/claude/realAgent';

   // Then use: const result = await realClaudeResponse(message);
   ```

**That's it!** Everything else stays the same.

---

## Limitations of Mock (Known)

- ❌ Can't understand complex requests
- ❌ Uses pattern matching, not AI
- ❌ Only handles simple intents
- ❌ No learning or context
- ❌ Not sophisticated

**But it's perfect for:**
- ✅ Testing the UI
- ✅ Testing tool execution
- ✅ Learning the flow
- ✅ Building before investing in API

---

## Dependencies

**No new npm packages needed!** All existing dependencies work:
- `next` - Already installed
- `react` - Already installed
- `lib/tasks.ts` - Already built

Mock agent runs 100% locally with pure TypeScript.

---

## Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Mock doesn't understand request | High | Low | Update pattern matching in mockAgent.ts |
| Tool execution fails | Low | Medium | Check error messages in console |
| localStorage updates don't reflect | Low | Medium | Refresh page, check browser DevTools |
| Easy to forget to swap later | Low | Low | Leave comments marking mock areas |

---

## Timeline

**Phase 1 (Tool definitions + mock):** 3-4 hours
- Create tools.ts
- Create executeTools.ts
- Create mockAgent.ts
- Create API routes

**Phase 2 (Chat UI):** 2-3 hours
- Create agent/page.tsx
- Add navigation
- Test everything

**Total:** 5-7 hours (1-2 days)

---

## Summary

**What you're building:**
- Tool definitions (no AI needed)
- Tool execution handlers
- Mock Claude that pattern matches
- Chat interface for testing
- Everything runs locally

**Files to create:**
- `lib/claude/tools.ts`
- `lib/claude/executeTools.ts`
- `lib/claude/mockAgent.ts` ← The mock!
- `app/api/claude/tools/route.ts`
- `app/api/claude/agent/route.ts`
- `app/agent/page.tsx`

**When ready for real Claude:**
- Swap mockAgent.ts for realAgent.ts
- Add Anthropic API key
- Everything else stays the same

**Cost:** Zero now, pennies later when using real API.

---

## Next Steps

Ready to build? The plan includes all code - you can copy/paste and it should work!

Key things to test:
1. Add tasks via chat
2. Complete tasks
3. Delete tasks
4. Task counter
5. localStorage persistence

Enjoy! 🚀
