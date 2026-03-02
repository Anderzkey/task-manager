# AI Task Manager

A task manager with a natural language interface. Instead of buttons and forms, you tell an AI agent what to do — it manages your tasks through conversation.

## What it does

Two interfaces, one task list:

- **Classic view** (`/`) — standard task list with add/complete/delete
- **Agent view** (`/agent`) — chat interface where you manage tasks by talking

Agent examples:
- `"Add a task: buy groceries"` → task created
- `"Mark the first task as done"` → task completed
- `"Delete all completed tasks"` → agent makes multiple tool calls to clean up

## Tech Stack

- **Next.js 15** + **React 19** + **TypeScript**
- **Tailwind CSS** for UI
- **AI Agent** with 3 tools: `add_task`, `complete_task`, `delete_task`
- **localStorage** for persistence (no backend needed)
- API routes for tool execution

## How to run

```bash
npm install
npm run dev
# Classic UI: http://localhost:3000
# Agent chat: http://localhost:3000/agent
```

## Architecture

The agent uses a tool-calling pattern:
1. User sends a message in natural language
2. Agent parses intent and selects the right tool(s)
3. Tools execute via API routes, modifying localStorage
4. Results display in the chat with confirmation
5. Multi-tool operations supported (e.g., clearing all completed = N delete calls)

Built to explore how AI agents can replace traditional CRUD interfaces with conversational UX.
