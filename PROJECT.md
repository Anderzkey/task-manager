# Task Manager - Project Plan

## Project Status: Phase 1 + Claude Agent Complete ✅✅

**GitHub Repository:** https://github.com/Anderzkey/task-manager
**Latest Feature:** Claude Agent with Mock AI (no API key needed)
**Implementation:** Phase 1 (MVP) + Phase 2 (Agent)
**Last Updated:** 2026-02-08 (Claude Agent Added)

### Plan Evolution

We've created **three versions** of this project at different complexity levels:

1. **`plans/ultra-simple-task-manager.md`** ⭐ **RECOMMENDED** - Single-user, localStorage, 3-5 days (12-20 hours)
2. `plans/simplified-task-manager.md` - Multi-user auth, 10-12 days (30-35 hours)
3. `plans/simple-task-manager.md` - Full features, 14-16 days (76+ hours)

**We're starting with the ultra-simple version.** Build it, ship it, learn from it. Add complexity later if needed.

---

## Overview (Ultra-Simple Version)

A **browser-based task manager with zero servers.** Add tasks, check them off, refresh the page—they're still there.

**Timeline:** 3-5 days (4-6 hours core, 12-20 hours with polish)
**Scope:** Add task → Check it off → Delete it → Tasks persist in localStorage
**Tech Stack:** Next.js 15 + React 19 + Tailwind CSS + localStorage (no backend)
**Hosting:** Vercel (free, one-click deploy)

---

## Core MVP Features (Ultra-Simple)

✅ **Add tasks** - Type + Enter
✅ **Check off tasks** - Mark complete with checkbox
✅ **Delete tasks** - Remove from list
✅ **Tasks persist** - Refresh page, tasks are still there (localStorage)
✅ **Simple UI** - Clean, single-column task list
✅ **Works offline** - No internet needed

**NOT in v1 (Deferred to v1.1 or later):**
- ❌ User accounts / login
- ❌ Filtering (by status, priority, date)
- ❌ Sorting options
- ❌ Search functionality
- ❌ Due dates or priorities
- ❌ Task descriptions
- ❌ Categories/projects
- ❌ Multi-user collaboration
- ❌ Cloud sync (single device)

---

## Tech Stack (Ultra-Simple)

**Frontend:**
- Next.js 15 with App Router
- React 19
- Tailwind CSS
- TypeScript (standard mode)

**Storage:**
- Browser localStorage (no backend needed)
- Data persists across page refreshes
- Single device only (no cloud sync in v1)

**Deployment:**
- Vercel (free, one-click deploy)

**What we're NOT using:**
- ❌ API Routes (all logic in React)
- ❌ Database (localStorage is the "database")
- ❌ Authentication (single-user)
- ❌ ORM or migrations

---

## Implementation: 2 Simple Phases

### Phase 1: Basic Functionality ✅ COMPLETE
**Status:** COMPLETE (Committed to GitHub)
**Time:** 8 hours planned, ~4 hours actual

**What was built:**
- ✅ Initialized Next.js 15 with TypeScript and Tailwind CSS
- ✅ Created localStorage helper functions (`lib/tasks.ts`)
- ✅ Built main page with task form + list
- ✅ Implemented add/toggle/delete task functionality
- ✅ Tested locally on `http://localhost:3000`

**Deliverables completed:**
- ✅ `npm run dev` works
- ✅ Can add, check off, and delete tasks
- ✅ Tasks survive page refresh (localStorage persistence)
- ✅ UI is clean and responsive
- ✅ All files committed to GitHub

**Files created:**
```
app/
├── layout.tsx       ✅
├── page.tsx         ✅
└── globals.css      ✅

lib/
└── tasks.ts         ✅

Configuration:
├── tsconfig.json    ✅
├── next.config.js   ✅
├── tailwind.config.js ✅
└── postcss.config.js ✅
```

---

### Phase 2: Polish & Deploy (Days 3-5 / ~4-8 hours)
**Status:** OPTIONAL - Not doing at this stage

**Optional improvements (for later):**
- Drag-and-drop reordering
- Dark mode toggle
- Clear all completed button
- Export tasks to JSON
- Animations

**When ready, deploy to:**
- Vercel (30 minutes, one-click)
- Share public URL

---

## Data Structure (localStorage)

No database needed. Tasks are stored in browser localStorage as JSON:

```javascript
// Task object in localStorage
{
  id: "task-1707417600000",
  title: "Buy milk",
  completed: false,
  createdAt: 1707417600000
}
```

**That's all the data you need.**

---

## Success Criteria

### Functional (v1)
- [ ] Add a task → appears in list
- [ ] Refresh page → task is still there
- [ ] Click checkbox → task gets strikethrough
- [ ] Click delete → task disappears
- [ ] Input clears after adding task
- [ ] "No tasks yet" message when list is empty

### Quality
- [ ] TypeScript standard mode passes
- [ ] No console errors
- [ ] Mobile responsive (375px+)
- [ ] Deployed to Vercel and accessible online

---

## Next Steps: Ready to Code

**See `plans/ultra-simple-task-manager.md` for detailed step-by-step instructions.**

Quick start:
1. Create Next.js project: `npx create-next-app@latest task-manager --typescript --tailwind`
2. Create `lib/tasks.ts` with localStorage helpers
3. Build task form + list in `app/page.tsx`
4. Test: `npm run dev` → add/check/delete tasks
5. Deploy to Vercel

**Expected time:** 4-6 hours core, 12-20 hours with polish

---

## Planning Notes

### Why We Chose Ultra-Simple

1. **Scope creep kills MVPs** - The original plan (14-16 days) had too many nice-to-haves
2. **localStorage is perfect for learning** - No server complexity, just React + data
3. **Ship fast, iterate based on real feedback** - 3-5 days to working app beats 14+ days to "perfect" app
4. **Single-user is enough for v1** - Multi-user features can wait until you validate the core product
5. **localStorage → Backend upgrade path** - Can swap Supabase/Firebase in later without rewriting core logic

### Architecture Decision Tree

| Question | Answer | Result |
|----------|--------|--------|
| Do I need users? | No, not for v1 | Skip auth |
| Do I need filtering? | No, small lists work | Skip in v1 |
| Do I need a server? | No, browser storage works | Use localStorage |
| Do I need a database? | No, localStorage is enough | Skip Prisma |
| Do I need API routes? | No, all logic in React | Skip backend |

**Result:** Ultra-simple, launchable in days, expandable later.

---

## Current Status

### Task Manager MVP (Phase 1) ✅
- ✅ Next.js 15 + React 19 + Tailwind CSS
- ✅ localStorage persistence
- ✅ Add/complete/delete tasks
- ✅ Task counter and statistics
- ✅ Mobile responsive
- ✅ Clean UI with blue gradient

### Claude Agent Interface (Phase 2) ✅
- ✅ Chat interface at `/agent`
- ✅ Mock Claude (pattern matching agent)
- ✅ Three tools: add_task, complete_task, delete_task
- ✅ Tool execution via API routes
- ✅ Full integration with localStorage
- ✅ Message history and auto-scroll
- ✅ Loading indicators and error handling
- ✅ Multi-tool operations (clear all completed tasks - makes 3+ calls at once)

### Testing & Deployment
- ✅ Tested locally - all features working
- ✅ Agent chat responds to natural language
- ✅ Tools execute correctly
- ✅ Committed and pushed to GitHub
- 📋 Ready for Vercel deployment
- 📋 Ready for real Claude API swap

**Next Options:**
- Deploy to Vercel (free hosting)
- Swap mock for real Claude API
- Add more tools (list_tasks, get_stats)
- Add streaming responses
- Implement persistent storage (database)
