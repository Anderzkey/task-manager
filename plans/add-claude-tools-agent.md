# Add Claude Tools & Agent - Implementation Plan

## Overview

Enable Claude to manage tasks on behalf of users by:
1. Creating **three Claude tool definitions** (`add_task`, `complete_task`, `delete_task`)
2. Building a **simple agent interface** where Claude can see tasks and use tools to manage them
3. Implementing **tool handlers** that wrap existing localStorage functions

**Timeline:** 2-3 days (8-12 hours)
**Scope:** Tools + basic agent chat interface (no streaming, no advanced UI)
**Tech:** Anthropic SDK, Next.js API routes, localStorage (existing)

---

## Problem Statement

Currently, users interact with tasks through UI buttons and forms. To enable AI agents to manage tasks programmatically, we need:

1. **Formalized tool definitions** - JSON schemas that Claude understands
2. **Tool execution endpoints** - API routes Claude can call
3. **Agent interface** - A place where Claude can chat and use tools
4. **Tool wrappers** - Functions that execute on task data via localStorage

This unlocks use cases like:
- "Claude, add these 5 tasks from my email"
- "Complete all high-priority tasks"
- "Show me tasks I should focus on next"

---

## Proposed Solution

### Architecture

```
User → Agent Chat Interface (new page)
  ↓
Claude receives message + tool definitions
  ↓
Claude decides to use tools (add_task, complete_task, delete_task)
  ↓
Tool execution in API routes (wraps lib/tasks.ts)
  ↓
Results returned to Claude
  ↓
Claude formulates response with results
  ↓
User sees Claude's response + task updates
```

### Three Tools to Create

1. **`add_task`** - Create a new task
   - Input: `title` (required), optional description/priority
   - Output: Created task object

2. **`complete_task`** - Mark task as done
   - Input: `task_id` (required)
   - Output: Updated task object

3. **`delete_task`** - Remove task
   - Input: `task_id` (required)
   - Output: Confirmation with deleted task details

---

## Technical Considerations

### Storage (localStorage)

**Existing behavior:**
- Tasks stored in browser localStorage at key `'tasks'`
- Single device only
- No server persistence

**For tools:**
- Tools execute on the client (Next.js runs on server during API call)
- localStorage not accessible from API routes directly
- **Solution:** Tool handlers receive task data from request body, update localStorage via client-side function

### Task ID Format

**Current:** `task-{timestamp}` (e.g., `task-1707417600000`)
- Simple but not UUID format
- Works fine for tools
- No change needed

### Authentication

**Current:** Single-user, no auth
- Tools don't need authentication checks
- No user isolation needed in v1
- Can add auth later if needed

### Error Handling

**Must handle:**
- Invalid task IDs (task doesn't exist)
- Missing required parameters
- Malformed requests

**Return format:** JSON with `{ success: boolean, data?: Task, error?: string }`

---

## Acceptance Criteria

### Functional Requirements

- [ ] **Tool 1 - `add_task`** works
  - Takes `title` parameter
  - Creates task in localStorage
  - Returns created task with ID

- [ ] **Tool 2 - `complete_task`** works
  - Takes `task_id` parameter
  - Toggles task completion status
  - Returns updated task

- [ ] **Tool 3 - `delete_task`** works
  - Takes `task_id` parameter
  - Removes task from list
  - Returns confirmation

- [ ] **Claude understands tools**
  - Tool descriptions are clear and detailed
  - Claude can see examples of how to use them

- [ ] **Agent chat interface** works
  - User can type messages to Claude
  - Claude receives tool definitions
  - Claude can call tools
  - User sees Claude's response

### Quality Requirements

- [ ] All tools use `strict: true` for schema validation
- [ ] Tools have detailed descriptions (3-4 sentences each)
- [ ] Tool input schemas include examples (input_examples)
- [ ] Error messages are helpful (guide Claude on retry)
- [ ] Chat interface is simple and clean
- [ ] No console errors

---

## Implementation Phases

### Phase 1: Tool Definitions & Handlers (4-5 hours)

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
    ],
    strict: true
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
    ],
    strict: true
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
    ],
    strict: true
  }
];
```

#### 1.2 Create Tool Handler Function

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
          return { success: false, error: 'Task ID is required and must be a string' };
        }
        toggleTask(task_id);
        const tasks = getTasks();
        const task = tasks.find(t => t.id === task_id);
        if (!task) {
          return { success: false, error: `Task with ID '${task_id}' not found` };
        }
        return { success: true, data: task };
      }

      case 'delete_task': {
        const { task_id } = toolInput;
        if (!task_id || typeof task_id !== 'string') {
          return { success: false, error: 'Task ID is required and must be a string' };
        }
        const tasks = getTasks();
        const task = tasks.find(t => t.id === task_id);
        if (!task) {
          return { success: false, error: `Task with ID '${task_id}' not found` };
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

#### 1.3 Create API Route for Tool Execution

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
    return NextResponse.json(
      { error: 'Failed to execute tool' },
      { status: 500 }
    );
  }
}
```

#### 1.4 Create Agent Message Handler

Create `lib/claude/agent.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { TASK_TOOLS } from './tools';

const client = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
});

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

export async function sendMessageToAgent(
  userMessage: string,
  conversationHistory: AgentMessage[] = []
): Promise<{ response: string; updatedHistory: AgentMessage[] }> {
  // Add user message to history
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage }
  ];

  // Send to Claude with tools
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    tools: TASK_TOOLS as Parameters<typeof client.messages.create>[0]['tools'],
    messages: messages as Parameters<typeof client.messages.create>[0]['messages']
  });

  // Check if Claude wants to use tools
  if (response.stop_reason === 'tool_use') {
    // Extract tool calls
    const toolUses = response.content.filter(block => block.type === 'tool_use');
    const toolResults = [];

    for (const toolUse of toolUses) {
      if (toolUse.type === 'tool_use') {
        // Execute tool via API
        const result = await fetch('/api/claude/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool_name: toolUse.name,
            tool_input: toolUse.input
          })
        }).then(r => r.json());

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }
    }

    // Send tool results back to Claude
    const finalResponse = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      tools: TASK_TOOLS as Parameters<typeof client.messages.create>[0]['tools'],
      messages: [
        ...messages,
        { role: 'assistant' as const, content: response.content },
        { role: 'user' as const, content: toolResults }
      ]
    });

    // Extract final text response
    const finalText = finalResponse.content
      .find(block => block.type === 'text')
      ?.text || 'No response generated';

    return {
      response: finalText,
      updatedHistory: [
        ...messages,
        { role: 'assistant' as const, content: finalText }
      ]
    };
  }

  // Claude didn't use tools, just return text response
  const responseText = response.content
    .find(block => block.type === 'text')
    ?.text || 'No response generated';

  return {
    response: responseText,
    updatedHistory: [
      ...messages,
      { role: 'assistant' as const, content: responseText }
    ]
  };
}
```

---

### Phase 2: Agent Chat Interface (3-4 hours)

#### 2.1 Create Agent Page Component

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
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
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
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 rounded-lg bg-white p-4 shadow-sm">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>Start by asking Claude to help you manage tasks:</p>
              <p className="text-sm mt-2">e.g., "Add these tasks: Buy milk, Walk dog, Review PRs"</p>
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
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                <p className="text-sm">Claude is thinking...</p>
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
            placeholder="Ask Claude to help you manage tasks..."
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
```

#### 2.2 Create Agent API Route

Create `app/api/claude/agent/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToAgent } from '@/lib/claude/agent';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const { response, updatedHistory } = await sendMessageToAgent(
      message,
      history
    );

    return NextResponse.json({ response, history: updatedHistory });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

#### 2.3 Add Navigation Link

Update `app/page.tsx` to include link to agent:
```typescript
// Add to header or navigation
<nav className="mb-4 flex gap-4">
  <a href="/agent" className="text-blue-600 hover:text-blue-800 font-medium">
    Talk to Claude
  </a>
</nav>
```

---

## Success Metrics

**Functional:**
- Claude can create tasks via `add_task`
- Claude can complete tasks via `complete_task`
- Claude can delete tasks via `delete_task`
- Agent chat interface is responsive

**Quality:**
- No console errors in browser or server
- Tool calls are executed correctly
- Tasks persist in localStorage after tool operations
- Agent responses are helpful and clear

**Testing checklist:**
```
1. Create a task via agent chat
   - User: "Add a task called 'Buy milk'"
   - Claude: Uses add_task tool
   - Result: Task appears in task manager

2. Complete a task
   - User: "Mark the milk task as done"
   - Claude: Uses complete_task with correct ID
   - Result: Task shows strikethrough in task manager

3. Delete a task
   - User: "Delete that task"
   - Claude: Uses delete_task tool
   - Result: Task removed from list

4. Error handling
   - User: "Complete task with ID xyz"
   - Claude: Calls with invalid ID
   - Result: Claude receives error, explains to user

5. Multiple tasks
   - User: "Add these tasks: Task 1, Task 2, Task 3"
   - Claude: Calls add_task three times (or recognizes need for parallel)
   - Result: All three tasks created
```

---

## Dependencies & Prerequisites

**New npm packages:**
- `@anthropic-ai/sdk` - For Claude API access

**Environment variables:**
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` - Claude API key

**Existing dependencies:**
- `next` - Already installed
- `react` - Already installed
- `lib/tasks.ts` - Already built

---

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Anthropic API rate limits | Low | Medium | Start with small messages, add caching later |
| localStorage not accessible from API | Low | High | Load/sync tasks in request body, or use SessionStorage pattern |
| Tool calls fail (invalid task ID) | Medium | Low | Validate IDs before execution, return clear errors to Claude |
| API key exposed | Low | Critical | Use `NEXT_PUBLIC_` only for client-side, keep secret key in env |
| Claude ignores tool descriptions | Low | Low | Make descriptions very detailed, add input_examples |

---

## Alternative Approaches Considered

### Approach 1: Server-Side Agent (Rejected)
- **Pro:** Cleaner architecture, server controls state
- **Con:** Requires backend database, adds complexity to v1

### Approach 2: Use Existing Database Instead
- **Pro:** More scalable
- **Con:** We're using localStorage intentionally for MVP

### Approach 3: Streaming Responses
- **Pro:** Faster user feedback
- **Con:** More complex, not needed for v1

**Chosen:** Client-side agent with localStorage (simplest, works with existing design)

---

## Documentation Plan

- [ ] Add comments to `lib/claude/tools.ts` explaining each tool
- [ ] Document tool definitions in code with examples
- [ ] Add brief usage instructions in agent UI
- [ ] No separate documentation files (keep it simple for MVP)

---

## References & Research

### Official Documentation
- [Claude API Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Implementing Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use)
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)

### Key Patterns Used
- `strict: true` for schema validation (guarantees correct types)
- `input_examples` for complex tool understanding
- Detailed descriptions (3-4 sentences each)
- Error objects with helpful messages
- Tool result response format: `{ success, data, error }`

### Example Code
- Tool definitions in `lib/claude/tools.ts`
- Handler execution in `lib/claude/executeTools.ts`
- Agent message processing in `lib/claude/agent.ts`

---

## Summary

**What you'll build:**
1. Three Claude tool definitions with strict schema validation
2. Tool handlers that wrap existing localStorage functions
3. API routes for tool execution and agent messaging
4. Simple chat interface for talking to Claude

**Files to create:**
- `lib/claude/tools.ts` - Tool definitions
- `lib/claude/executeTools.ts` - Tool execution handlers
- `lib/claude/agent.ts` - Agent message loop
- `app/api/claude/tools/route.ts` - Tool execution endpoint
- `app/api/claude/agent/route.ts` - Agent endpoint
- `app/agent/page.tsx` - Chat interface

**Time:** 2-3 days (8-12 hours)

**After this:**
- Agents can manage tasks programmatically
- Could expand to streaming responses
- Could add more tools (list_tasks, get_stats)
- Foundation for future integrations
