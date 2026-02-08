# Test & Implement: Clear All Completed Tasks

## Overview

Test the current mock agent's ability to handle a bulk operation: "clear all completed tasks"

The agent should:
1. Detect intent (clear/delete + completed tasks)
2. Find all completed tasks
3. Make multiple `delete_task` tool calls (one per completed task)
4. Respond with confirmation of how many were deleted

**Goal:** Verify current mock can handle multi-task operations

---

## Current State Analysis

### What Works Now ✅
- Mock Claude detects: add, complete, delete, list intents
- Delete tool can execute single deletions
- Agent returns `toolCalls` array (supports multiple calls)
- API routes execute all tool calls in the `toolCalls` array

### What's Missing ❌
- No pattern detection for "clear all completed"
- No logic to return multiple `delete_task` calls
- Currently only deletes first/last/named task (one at a time)

### Proof: The Architecture Already Supports Multiple Tool Calls

**File:** `app/api/claude/agent/route.ts` (lines 40-55)

```typescript
// Step 2: Execute any tools the mock decided to use
const toolResults = [];
for (const toolCall of toolCalls) {  // ← Loops through ALL tool calls!
  const result = await executeTool(
    toolCall.name as 'add_task' | 'complete_task' | 'delete_task',
    toolCall.input
  );
  toolResults.push({
    toolName: toolCall.name,
    success: result.success,
    data: result.data,
    error: result.error
  });
}
```

**Verdict:** The API is ready! We just need to update mock agent to return multiple calls.

---

## Test Scenario

### Setup
```
1. Create 5 tasks:
   - Buy milk (complete: false)
   - Walk dog (complete: false)
   - Review PR (complete: true)   ← Completed
   - Write docs (complete: true)  ← Completed
   - Exercise (complete: true)    ← Completed

   Total: 3 completed, 2 pending
```

### User Request
```
You: "Clear all completed tasks"
```

### Expected Behavior
```
Mock Claude should:
1. Detect "clear" + "completed" intent
2. Find 3 completed tasks: Review PR, Write docs, Exercise
3. Return toolCalls array with 3 delete_task calls:
   [
     { name: 'delete_task', input: { task_id: 'task-X' } },
     { name: 'delete_task', input: { task_id: 'task-Y' } },
     { name: 'delete_task', input: { task_id: 'task-Z' } }
   ]
4. Agent API executes all 3 deletions
5. Respond: "✓ Cleared 3 completed tasks. You have 2 tasks remaining."

Result: Chat shows confirmation, task manager shows only 2 tasks left
```

---

## Implementation Plan

### Phase 1: Test Current State (5 minutes)

**Test if current mock can handle it:**
```bash
User: "Clear all completed tasks"
Mock: Falls through to default response
Result: ❌ Feature not recognized
```

**Expected Outcome:** Confirm feature doesn't exist yet

### Phase 2: Add "Clear Completed" Intent to Mock Agent (15 minutes)

**File:** `lib/claude/mockAgent.ts`

**Add new intent handler (before default response):**

```typescript
// ===== INTENT: CLEAR COMPLETED TASKS =====
if (
  message.includes('clear') ||
  message.includes('delete all') ||
  message.includes('remove all')
) {
  // Check if user wants to clear completed tasks specifically
  if (message.includes('completed') || message.includes('done')) {
    const completedTasks = tasks.filter(t => t.completed);

    if (completedTasks.length === 0) {
      return {
        response: "You don't have any completed tasks to clear.",
        toolCalls: []
      };
    }

    // Create multiple delete_task calls
    const toolCalls = completedTasks.map(task => ({
      name: 'delete_task',
      input: { task_id: task.id }
    }));

    const remaining = tasks.length - completedTasks.length;

    return {
      response: `✓ Cleared ${completedTasks.length} completed task${completedTasks.length === 1 ? '' : 's'}. You have ${remaining} task${remaining === 1 ? '' : 's'} remaining.`,
      toolCalls
    };
  }

  // User said "clear" but not "completed" - ask for clarification
  return {
    response: "What would you like to clear? (e.g., 'Clear all completed tasks')",
    toolCalls: []
  };
}
```

**Location:** Insert after the "DELETE TASK" intent block (after line 160)

### Phase 3: Test the New Feature (10 minutes)

**Test 1: Clear with 3 completed tasks**
```
Setup: 3 completed, 2 pending
Request: "Clear all completed tasks"
Expected: 3 delete_task calls executed, response shows "Cleared 3 tasks"
Result: ✅ or ❌
```

**Test 2: Clear with no completed tasks**
```
Setup: 0 completed, 5 pending
Request: "Clear all completed tasks"
Expected: "You don't have any completed tasks to clear."
Result: ✅ or ❌
```

**Test 3: Clear with all completed**
```
Setup: 5 completed, 0 pending
Request: "Clear all completed tasks"
Expected: 5 delete_task calls, "Cleared 5 tasks. You have 0 tasks remaining."
Result: ✅ or ❌
```

**Test 4: Ambiguous "clear"**
```
Setup: Any tasks
Request: "Clear everything"
Expected: "What would you like to clear?"
Result: ✅ or ❌
```

---

## Acceptance Criteria

- [ ] Mock agent detects "clear all completed tasks" intent
- [ ] Creates multiple `delete_task` tool calls (one per completed task)
- [ ] API route executes all tool calls successfully
- [ ] Response shows count of cleared tasks
- [ ] Remaining task count is accurate
- [ ] localStorage updates show tasks actually deleted
- [ ] Chat displays final confirmation message
- [ ] All tests pass without errors

---

## Technical Notes

### Why This Works
1. **toolCalls is an array** - Already supports multiple calls
2. **Agent API loops through toolCalls** - Already executes each one
3. **Mock returns toolCalls** - Just needs to populate array with multiple items

### No Breaking Changes
- Existing intents (add, complete, delete, list) unchanged
- Only adds new "clear" intent handler
- Backward compatible with current implementation

### Performance
- Clearing 100 completed tasks = 100 API requests (fine for MVP)
- No batching optimization needed for testing
- Can optimize later if needed

---

## Edge Cases

**Case 1:** User says "delete completed" (not "clear")
- Currently: Falls through to generic delete (deletes first completed task only)
- Solution: Also check for "delete" + "completed" pattern

**Case 2:** User says "clear all" (without "completed")
- Currently: Would be ambiguous
- Solution: Ask for clarification (implemented in plan)

**Case 3:** Tasks deleted mid-operation
- Not a concern in mock (synchronous)
- Real API would need transaction handling

---

## Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `lib/claude/mockAgent.ts` | Add "clear completed" intent handler | +30 lines |

**Total:** 1 file, ~30 lines of new code

---

## Success Metrics

✅ **Functional**: Agent makes 3 tool calls when 3 tasks completed
✅ **Behavioral**: Response count matches actual deletions
✅ **UX**: Chat shows clear confirmation
✅ **Data**: localStorage updated with all deletions

---

## References

**Current Implementation:**
- `lib/claude/mockAgent.ts:127-160` - Delete intent (single task)
- `app/api/claude/agent/route.ts:40-55` - Tool execution loop (supports multiple)

**Architecture Note:**
The API is architecturally ready for multi-tool operations. Mock just needs to return multiple entries in the `toolCalls` array.

---

## Summary

**Test:** Ask agent "Clear all completed tasks"
**Current:** Feature doesn't exist → falls to default response
**Expected:** Agent creates multiple delete_task calls → all completed tasks deleted
**Implementation:** Add ~30 lines to mockAgent.ts for "clear completed" intent

The infrastructure already supports it. Just need to add the pattern detection!
