# Task Manager - Project Plan

## Project Status: Planning Complete ✅

**GitHub Repository:** https://github.com/Anderzkey/task-manager
**Plan Document:** `plans/simple-task-manager.md`
**Last Updated:** 2026-02-07

---

## Overview

A **simple, focused task manager MVP** that demonstrates full-stack development fundamentals. Learn by building core features well, not by adding every feature.

**Timeline:** 14-16 days (40-50 hours solo development)
**Scope:** Task CRUD + auth + filtering/sorting/search (no categories, Kanban, or keyboard shortcuts in MVP)
**Tech Stack:** Next.js 15 + React 19 + Tailwind CSS + Prisma + PostgreSQL/SQLite

---

## Core MVP Features

- [x] **Defined** User authentication (sign up, login with JWT)
- [x] **Defined** Create tasks with title, description, priority, due date
- [x] **Defined** Mark tasks as complete/incomplete (status changes)
- [x] **Defined** Delete tasks (soft delete)
- [x] **Defined** List all tasks with pagination (20 per page)
- [x] **Defined** View task details
- [x] **Defined** Edit task details
- [x] **Defined** Filter by status (pending, in-progress, completed)
- [x] **Defined** Filter by priority (low, medium, high)
- [x] **Defined** Filter by due date (overdue, due today, due this week, future)
- [x] **Defined** Sort by created date or due date
- [x] **Defined** Search by title

**NOT in MVP (Phase 5 future work):**
- ❌ Categories/projects
- ❌ Kanban board with drag-and-drop
- ❌ Keyboard shortcuts
- ❌ Task comments
- ❌ File attachments
- ❌ Real-time updates
- ❌ Multi-user collaboration

---

## Tech Stack (Locked In)

**Frontend:**
- Next.js 15 with App Router
- React 19
- Tailwind CSS
- TypeScript (standard mode, not strict)

**Backend:**
- Next.js API Routes
- Prisma ORM
- JWT authentication with bcryptjs

**Database:**
- SQLite (development)
- PostgreSQL (production)
- Indexed schema for performance

**State Management:**
- React Context + useState (simple)
- React Query (Phase 2b for caching)

**Deployment:**
- Vercel (recommended) OR self-hosted Node.js

---

## Implementation Phases

### Phase 1: Foundation & Setup (Days 1-2 / ~8 hours)
**Status:** NOT STARTED - Start tomorrow

- [ ] Initialize Next.js project with TypeScript + Tailwind
- [ ] Set up Prisma with SQLite
- [ ] Create database schema with indexes:
  - User model (id, email, password, createdAt)
  - Task model (id, userId, title, description, status, priority, dueDate, createdAt, updatedAt, deletedAt)
  - **Critical indexes:** userId, userId+status, userId+dueDate
- [ ] Create folder structure (app/, components/, lib/, prisma/)
- [ ] Initialize git repo ✅ (done)
- [ ] Push to GitHub ✅ (done at https://github.com/Anderzkey/task-manager)

**Deliverables:**
- [ ] Project runs locally with `npm run dev`
- [ ] Database schema created and migrations run
- [ ] Git tracking initial commit

---

### Phase 2a: Authentication (Days 3-4 / ~12 hours)
**Status:** NOT STARTED

- [ ] Implement JWT token utilities (sign, verify)
- [ ] Create auth middleware for protected routes
- [ ] Implement password hashing (bcryptjs)
- [ ] API: `POST /api/auth/signup` - user registration
- [ ] API: `POST /api/auth/login` - user login
- [ ] Frontend: Signup form component
- [ ] Frontend: Login form component
- [ ] Ensure user isolation (all queries filtered by userId)

**Key Security:**
- Passwords hashed with bcryptjs (10+ rounds)
- JWT stored in httpOnly cookies
- All task routes enforce authentication
- Users cannot access other users' tasks (403 error)

---

### Phase 2b: Task CRUD (Days 5-8 / ~20 hours)
**Status:** NOT STARTED

- [ ] API: `POST /api/tasks` - create task
- [ ] API: `GET /api/tasks?page=1` - list with pagination (20 per page)
- [ ] API: `GET /api/tasks/[id]` - get single task
- [ ] API: `PATCH /api/tasks/[id]` - update task
- [ ] API: `DELETE /api/tasks/[id]` - soft delete task
- [ ] Set up React Query for client-side caching
- [ ] Components: TaskList (paginated), TaskItem, TaskForm, StatusBadge, PriorityBadge
- [ ] Prevent N+1 queries (use Prisma select/include carefully)
- [ ] Add query validation (enforce pagination limits)
- [ ] Basic tests for CRUD operations

---

### Phase 3: Filtering, Sorting & Polish (Days 9-10 / ~16 hours)
**Status:** NOT STARTED

- [ ] Filter by status (pending, in-progress, completed)
- [ ] Filter by priority (low, medium, high)
- [ ] Filter by due date (quick buttons: overdue, due today, due this week, future)
- [ ] Sort by created date (default) or due date
- [ ] Search by title (simple string match)
- [ ] Add loading states and error messages
- [ ] Add toast notifications for success/error
- [ ] Highlight overdue tasks in red
- [ ] Make responsive for mobile (375px width)
- [ ] Write critical path tests (40-50% coverage)

**NOT included:**
- No drag-and-drop (move to Phase 5)
- No keyboard shortcuts (move to Phase 5)
- No lazy-loading descriptions (just truncate)
- No memoization optimizations (not needed yet)

---

### Phase 4: Deployment & Documentation (Days 11-14 / ~20 hours)
**Status:** NOT STARTED

- [ ] Set up PostgreSQL for production
- [ ] Configure environment variables securely
- [ ] Add pagination validation on API routes
- [ ] Deploy to Vercel (or self-hosted Node.js)
- [ ] Create README.md with setup and deployment instructions
- [ ] Document environment variables
- [ ] Set up local development guide
- [ ] Final testing on production URL

**Documentation:**
- One README.md file only (no API.md, ARCHITECTURE.md, etc.)
- Code is self-documenting

---

## Database Schema (Final)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcryptjs hashed
  createdAt DateTime @default(now())
  tasks     Task[]

  @@index([email])
}

model Task {
  id          String   @id @default(cuid())
  userId      String
  title       String   @db.VarChar(255)
  description String?  @db.Text
  status      String   @default("pending")  // pending, in-progress, completed
  priority    String   @default("medium")   // low, medium, high
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?  // Soft delete

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, status])
  @@index([userId, dueDate])
  @@unique([userId, id])
}
```

---

## Success Criteria

### Functional (MVP)
- [ ] User can sign up and login
- [ ] User can create/read/update/delete tasks
- [ ] User can filter by status, priority, due date
- [ ] User can sort and search tasks
- [ ] User isolation enforced (can't see other users' tasks)
- [ ] Soft deletes working (deleted tasks hidden but preserved)

### Performance
- [ ] API responses < 200ms (with indexes + pagination)
- [ ] Page loads < 1.5s (TTI)
- [ ] First Contentful Paint < 1s
- [ ] No N+1 queries

### Quality
- [ ] 40-50% test coverage (critical paths)
- [ ] TypeScript standard mode passes
- [ ] No console errors in production
- [ ] Mobile responsive (375px+)
- [ ] Passwords hashed, user isolation enforced

---

## Tomorrow's Plan

**Start with Phase 1: Foundation & Setup**

1. Create Next.js project: `npx create-next-app@latest task-manager --typescript --tailwind`
2. Install Prisma: `npm install @prisma/client prisma`
3. Set up SQLite database schema in `prisma/schema.prisma`
4. Run migrations: `npx prisma migrate dev --name init`
5. Create basic page structure
6. Verify everything runs: `npm run dev`
7. Commit to git

**Expected time:** 2-3 hours

---

## Compound Knowledge

### Lessons Learned (So Far)
- Scope reduction is critical for MVP success (removed categories, Kanban, keyboard shortcuts)
- Database indexes from day 1 (30-min setup, 10x performance gain)
- React Query in Phase 2 for caching (not optional for good UX)
- Authentication must be Phase 2, not deferred
- Realistic timeline: 14-16 days for solo dev, not 10

### Architecture Decisions
- **Single Next.js codebase** (not separate frontend/backend) - simplicity over separation
- **JWT + httpOnly cookies** (not external auth service) - learning value
- **SQLite dev / PostgreSQL prod** - no setup friction during development
- **React Query over Context alone** - handles caching/refetching elegantly
- **Soft deletes not hard deletes** - audit trail and recovery options

### Performance Principles
- Pagination from day 1 (not added later)
- Database indexes on userId, status, dueDate (essential)
- N+1 prevention with Prisma (use select/include wisely)
- React Query staleTime: 5 minutes (balance between fresh data and reduced requests)

---

## Notes

- **GitHub Repo:** https://github.com/Anderzkey/task-manager (initialized, first commit pushed)
- **Plan reviewed by:** Architecture Strategist, Simplicity Reviewer, Performance Oracle
- **Key feedback:** Reduced scope by 25-30%, extended timeline to 14-16 days, moved auth to Phase 2
- **Next session:** Begin Phase 1 (Next.js setup + database schema)
