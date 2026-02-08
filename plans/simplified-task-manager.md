# Task Manager MVP - Simplified Plan

## Executive Summary

A **super-focused task manager MVP** with only the essential features. Launch faster by cutting scope to CRUD + login, no filtering/sorting/search in v1.

**Timeline:** 10-12 days (30-35 hours solo development)
**Scope:** Create, Read, Update, Delete tasks + basic authentication
**Tech Stack:** Next.js 15 + React 19 + Tailwind + Prisma + SQLite
**Philosophy:** Ship a working, simple MVP first. Add filtering/sorting in v1.1.

---

## What We're Building

A personal task manager where you can:
- ✅ Sign up and login
- ✅ Add tasks with title and optional notes
- ✅ See all your tasks in a list
- ✅ Mark tasks as complete (with strikethrough)
- ✅ Edit task text
- ✅ Delete tasks

**That's it.** No priorities, no due dates, no categories, no filtering. Just a clean list of your tasks.

---

## Why This is Simpler

| Feature | Original Plan | Simplified | Reason |
|---------|---------------|-----------|--------|
| **Auth** | JWT tokens | Session cookies | Sessions are simpler, more secure for single-user |
| **Filtering** | 4 filter types (status, priority, date) | None in v1 | Not required for MVP validation |
| **Sorting** | Created date + due date | Newest first (default) | Linear list is fine for <100 tasks |
| **Search** | Title search | No search in v1 | Not needed for small lists |
| **Status** | pending/in-progress/completed | complete/incomplete | Simpler mental model |
| **Priority** | low/medium/high | None | Deferring to v1.1 |
| **Due dates** | Full date filtering | No due dates in v1 | Deferring to v1.1 |
| **Soft deletes** | Preserve deleted tasks | Hard delete (simpler) | MVP doesn't need recovery |
| **Testing** | 40-50% coverage | 20-30% coverage | Cover happy path only |

**What changes:**

**Original:** 4 phases, 14-16 days, 76+ hours of work
**Simplified:** 2 phases, 10-12 days, 30-35 hours of work

---

## Database Schema (Minimal)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcryptjs hashed
  createdAt DateTime @default(now())
  tasks     Task[]
}

model Task {
  id          String   @id @default(cuid())
  userId      String
  title       String
  notes       String?  // Optional description
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Why this is simpler:**
- No status enum (just completed: boolean)
- No priority field
- No dueDate (eliminate scheduling complexity)
- No deletedAt (hard delete is fine)
- Only one index (userId)

---

## Implementation: 2 Simple Phases

### Phase 1: Foundation & Setup (Days 1-2 / ~8 hours)

**Goal:** Get a working Next.js app with login/signup

**Checklist:**
- [ ] Create Next.js project: `npx create-next-app@latest task-manager --typescript --tailwind`
- [ ] Install dependencies: `npm install @prisma/client prisma bcryptjs`
- [ ] Set up Prisma: `npx prisma init`
- [ ] Create schema above in `prisma/schema.prisma`
- [ ] Run migration: `npx prisma migrate dev --name init`
- [ ] Create basic folder structure:
  ```
  app/
  ├── layout.tsx
  ├── page.tsx (home/task list)
  ├── login/page.tsx
  ├── signup/page.tsx
  └── api/
      ├── auth/
      │   ├── login/route.ts
      │   ├── signup/route.ts
      │   └── logout/route.ts
      └── tasks/
          └── route.ts
  ```
- [ ] Create simple navigation (logout button)
- [ ] Test locally: `npm run dev`
- [ ] Git commit

**Success:** App runs, pages exist, database connects, no signup/login logic yet

---

### Phase 2: CRUD + Auth (Days 3-10 / ~24 hours)

**Goal:** Full working app with login, tasks, and basic UI

#### 2.1 Authentication (Days 3-4 / ~6 hours)

**API Routes:**
- `POST /api/auth/signup` - Create user account, store hashed password
- `POST /api/auth/login` - Validate password, create session
- `POST /api/auth/logout` - Clear session

**Frontend:**
- Login form at `/login`
- Signup form at `/signup`
- Logout button in navigation

**Key:** Use HTTP-only session cookies (not JWT). Simpler and more secure.

**Code pattern (minimal example):**
```typescript
// Sign up user
const user = await prisma.user.create({
  data: {
    email: userEmail,
    password: bcryptjs.hashSync(userPassword, 10)
  }
});
// Create session cookie
// Redirect to /
```

#### 2.2 Task CRUD (Days 5-9 / ~16 hours)

**API Routes:**
- `GET /api/tasks` - List all user's tasks (no pagination, no filtering)
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/[id]` - Update task (toggle complete, edit text)
- `DELETE /api/tasks/[id]` - Delete task

**Frontend Components:**
- `TaskList.tsx` - Simple list of tasks
- `TaskItem.tsx` - Single task row with edit/delete/complete button
- `TaskForm.tsx` - Input field to add new task
- `CompletedBadge.tsx` - Strikethrough indicator

**Simple behavior:**
- Click "Done" to mark complete (strikethrough + gray out)
- Click "Edit" to open task text in editable input
- Click "Delete" to remove task
- Type in input at top and press Enter to add task

**State management:** React Query (caching + refetch) is optional; useState + fetch is fine

---

### Phase 2 Deliverables (By Day 10)

✅ Users can sign up
✅ Users can login
✅ Users can add tasks
✅ Users can mark tasks complete
✅ Users can edit task text
✅ Users can delete tasks
✅ Users can logout
✅ Users can't see other users' tasks
✅ App runs locally with `npm run dev`
✅ Deployed to Vercel or similar

---

## What We're NOT Building (V1)

| Feature | When? | Why |
|---------|-------|-----|
| Filtering by status | v1.1 | Doesn't add value for <100 tasks |
| Sorting | v1.1 | Newest-first default is enough |
| Search | v1.1 | Too many tasks = need filtering first |
| Due dates | v1.1 | Adds date picker complexity |
| Priority levels | v1.1 | Simple list doesn't need priorities |
| Categories | v2 | Multi-user feature, not needed for MVP |
| Kanban board | v2 | Complex UI, defer to later |
| Keyboard shortcuts | v2 | Nice-to-have, not required |
| Drag-and-drop | v2 | Overkill for simple list |
| Mobile app | v2 | Responsive web is enough |
| Notifications | v2 | Offline feature, not critical |
| Real-time sync | v2 | Periodic refresh is fine |

---

## Architecture: Session-Based Auth (Not JWT)

**Why sessions instead of JWT?**

| Aspect | Sessions | JWT |
|--------|----------|-----|
| Complexity | ✅ Simpler | ❌ More complex |
| Security | ✅ Better control | ❌ Revocation is hard |
| Logout | ✅ Instant | ❌ Delayed (until expiry) |
| Scalability | ⚠️ Requires server memory | ✅ Stateless |
| Single-user MVP | ✅ Perfect | ❌ Overkill |

**For your MVP:** Server-side session storage (Node.js in-memory or simple database) is ideal.

**Pattern:**
```
User logs in → Hash password, validate → Create session record
→ Return session ID in httpOnly cookie → User makes request
→ Check session ID is valid → Proceed
```

---

## Success Criteria (V1)

### Functional
- [ ] User can sign up with email/password
- [ ] User can login
- [ ] User can create, read, update, delete tasks
- [ ] User can mark tasks complete (visual strikethrough)
- [ ] User cannot see other users' tasks (403 error)
- [ ] Logout clears session

### Performance
- [ ] Page loads in <2 seconds
- [ ] API responds in <200ms
- [ ] No console errors

### Quality
- [ ] TypeScript standard mode passes
- [ ] Mobile-responsive (375px+)
- [ ] Basic accessibility (semantic HTML)
- [ ] 20-30% test coverage (happy path only)

### Deployment
- [ ] App runs locally with `npm run dev`
- [ ] Deployed to Vercel (or self-hosted)
- [ ] README.md explains setup

---

## Git Workflow

**Start Phase 1:**
```bash
git checkout -b feature/foundation
# Build Phase 1
git commit -m "feat: setup next.js project and database schema"
git push origin feature/foundation
# Create PR, merge to main
```

**Start Phase 2:**
```bash
git checkout -b feature/auth-and-crud
# Build Phase 2
git commit -m "feat: add user auth (signup, login, logout)"
git commit -m "feat: implement task CRUD endpoints"
git commit -m "feat: add task list UI and forms"
git push origin feature/auth-and-crud
# Create PR, merge to main
```

---

## Development Commands

```bash
npm run dev                    # Start dev server (port 3000)
npx prisma migrate dev        # Create new migration
npx prisma studio            # Open Prisma data browser
npm test                      # Run tests
npm run build && npm start    # Production build and start
```

---

## Realistic Timeline

| Phase | Days | Hours | What You're Doing |
|-------|------|-------|-------------------|
| **Setup** | 1-2 | 8 | Next.js + Prisma + database |
| **Auth** | 3-4 | 6 | Login/signup pages + validation |
| **Task CRUD** | 5-9 | 16 | API routes + React components |
| **Polish** | 10 | 3 | UI cleanup, error messages |
| **Deploy** | 10-12 | 2 | Push to Vercel |
| **Buffer** | (overflow) | (overflow) | Edge cases, final testing |

**Total:** 10-12 days working 3-4 hours per day

---

## Next Steps

1. **Read this plan** (done ✅)
2. **Start Phase 1** - Initialize Next.js and Prisma
3. **Build Phase 2** - Auth and CRUD in parallel
4. **Deploy** - Push to production
5. **Celebrate** - You shipped an MVP! 🎉

---

## Future Enhancements (Not V1)

Once v1 is shipped and working:

**v1.1 (Days 11-14):**
- Add filtering (by completion status)
- Add sorting options
- Add basic search

**v1.2 (Days 15-18):**
- Add due dates
- Add priority levels
- Add task edit modal (instead of inline editing)

**v2.0 (Later):**
- Categories/projects
- Sharing with others
- Recurring tasks
- Mobile app
- Calendar view

---

## Key Differences from Original Plan

| Aspect | Original | Simplified | Savings |
|--------|----------|-----------|---------|
| Phases | 4 phases | 2 phases | 50% conceptually simpler |
| Days | 14-16 days | 10-12 days | 25% faster |
| Hours | 76+ hours | 30-35 hours | 55% less work |
| Features | Task CRUD + filtering/sorting/search | Task CRUD only | 60% less code |
| Database fields | 9 fields | 6 fields | 33% simpler schema |
| API endpoints | 8-10 routes | 4 routes | Easier to debug |
| Auth | JWT tokens | Session cookies | Simpler security |
| Testing | 40-50% coverage | 20-30% coverage | Focus on core paths |

---

## The Philosophy

**MVP = Minimal Viable Product, not Minimal Viable Feature Set**

Your MVP needs to:
1. **Work** - Tasks persist, survive page reload
2. **Be secure** - Users can't see others' tasks
3. **Be simple** - Clear UI, no confusing options
4. **Be deployable** - Works in production

Your MVP does NOT need to:
- Have every filtering option
- Be perfectly performant (good enough is fine)
- Have 80% test coverage (happy path is enough)
- Support every use case (basic use case first)

**Launch this in 10-12 days. Gather user feedback. Then decide what to add next.**

---

## Questions?

If you get stuck:
1. Check the database schema (is your data structure right?)
2. Test authentication (can you create/login to accounts?)
3. Test CRUD (can you add/edit/delete tasks?)
4. Deploy (does it work in production?)

Focus on these in order. Everything else is polish.
