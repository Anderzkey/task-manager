# Simple Task Manager - Implementation Plan

## Overview

Build a **simple, focused task manager MVP** that demonstrates full-stack development fundamentals. This is a learning project prioritizing clean architecture over feature completeness. Focus on doing one thing well: task CRUD operations.

**Scope:** Tasks only. No categories, no drag-and-drop Kanban, no keyboard shortcuts in MVP.
**Timeline:** 14-16 days realistic (revised from 10 days based on review feedback).
**Philosophy:** Minimal viable features that deliver value. Defer nice-to-haves to Phase 4.

## Problem Statement / Motivation

A personal task manager helps users organize, prioritize, and track their work. This project serves to:
- Learn modern full-stack development patterns
- Practice CRUD operations with proper validation
- Implement user-friendly UI/UX for task management
- Understand database design and API architecture
- Gain experience with deployment and testing

## Proposed Solution

Create a full-stack task manager with:
- **Frontend**: Clean, responsive UI with drag-and-drop support
- **Backend**: RESTful API with proper validation and authentication
- **Database**: Relational schema supporting tasks, categories, and user data
- **Features**: Create, read, update, delete tasks; categorize; set priorities; track due dates

## Technical Considerations

### Architecture Impacts
- **Full-stack approach**: Single language across frontend and backend reduces context switching
- **Database choices**: Affects scalability, complexity, and deployment
- **Authentication**: User isolation critical for multi-user scenarios
- **Real-time updates**: Affects frontend state management and backend design

### Performance Implications
- Task pagination for performance (loading 20 tasks per page, not all)
- Database indexes on frequently filtered fields (user_id, status, due_date)
- Client-side filtering vs server-side - implement server-side for scalability
- Lazy-load task descriptions until expanded (optional enhancement)

### Security Considerations
- Always validate input on both client and server
- Filter all queries by authenticated user ID (prevent data leaks)
- Use bcrypt or similar for password hashing
- Implement CORS properly for API access
- Validate task ownership before updates/deletes

## Tech Stack Selection

### Next.js Full-Stack (Single Choice)
**Why this stack:**
- Single JavaScript/TypeScript codebase
- Built-in API routes (no separate backend to manage)
- Excellent developer experience with hot reload
- Strong TypeScript support out of the box
- Easy deployment to Vercel (zero-config)
- Great for learning all pieces together
- Smallest learning curve

**Tech Stack:**
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Auth**: Simple JWT + bcryptjs (no external services)
- **State Management**: React Context + useState (simple)
- **Data Fetching**: React Query (Phase 2, for caching)
- **Deployment**: Vercel or self-hosted Node.js

**Commitment:** One stack, one clear path. No alternatives. Removes decision paralysis.

## Implementation Phases

### Phase 1: Foundation & Setup (Days 1-2 / ~8 hours)
**Objective**: Project structure and infrastructure ready

**Tasks:**
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up database with Prisma (SQLite for local dev, PostgreSQL setup script for prod)
3. Create project folder structure:
   - `app/` - Next.js app directory
   - `app/api/tasks/` - API routes
   - `app/components/` - React components
   - `lib/` - Utilities and helpers
   - `prisma/` - Database schema
4. Initialize git repository
5. Create `.env.local` template (document it shouldn't be committed)
6. Set up basic Tailwind configuration

**Database Schema (Prisma) - CRITICAL:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  tasks     Task[]

  @@index([email])
}

model Task {
  id          String   @id @default(cuid())
  userId      String
  title       String   @db.VarChar(255)
  description String?  @db.Text
  status      String   @default("pending") // pending, in-progress, completed
  priority    String   @default("medium")  // low, medium, high
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?  // Soft delete for audit trail

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // PERFORMANCE CRITICAL: Add these indexes
  @@index([userId])
  @@index([userId, status])
  @@index([userId, dueDate])
  @@unique([userId, id])
}
```

**Note on Schema:** No categories, no comments, no subtasks. Pure focus on tasks.

**Deliverables:**
- Project runs locally with `npm run dev`
- Basic page structure with navigation
- Database schema with proper indexes
- Middleware setup for authentication
- Git repo initialized

**Success Criteria:**
- [ ] Project creates without errors
- [ ] Can access homepage at localhost:3000
- [ ] `npm run dev` works, no console errors
- [ ] `npx prisma migrate dev` runs successfully
- [ ] TypeScript standard mode passes (not strict)

---

### Phase 2a: Authentication (Days 3-4 / ~12 hours)
**Objective**: Implement user authentication (JWT-based) with middleware

**2a.1 Authentication System**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user, return JWT token
- `lib/auth.ts` - JWT utilities (sign, verify tokens)
- `lib/middleware.ts` - Auth middleware for protected routes
- Frontend signup and login forms
- Store JWT in httpOnly cookies (secure)

**2a.2 Protected Routes**
- Auth middleware validates JWT on all `/api/tasks/*` routes
- Inject authenticated user ID into request context
- Return 401 if no valid token

**Key Security Notes:**
- Use bcryptjs for password hashing (10+ rounds)
- Enforce user isolation: filter all queries by authenticated userId
- Return 403 if user tries to access another user's task

**Deliverables:**
- User registration/login working
- Auth middleware protecting all task routes
- JWT tokens generated and validated correctly
- Password hashing with bcryptjs
- Cookies properly configured (httpOnly, secure in production)

**Success Criteria:**
- [ ] Can create account and login
- [ ] JWT token returned on successful login
- [ ] Protected routes reject requests without token
- [ ] Users cannot see other users' tasks (403 error)
- [ ] Password validation enforced (min 8 chars, etc.)

---

### Phase 2b: Core Task CRUD (Days 5-8 / ~20 hours)

**Objective**: Full CRUD operations with API and basic UI

**2b.1 API Routes**
- `POST /api/tasks` - Create task (requires auth)
- `GET /api/tasks?status=pending&page=1` - List with pagination (20 per page)
- `GET /api/tasks/[id]` - Get single task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task (soft delete)

**2b.2 Query Complexity Validation**
Important: Prevent performance issues by validating queries:
```typescript
// Enforce pagination
const take = Math.min(parseInt(query.limit) || 20, 100);
const page = Math.max(1, parseInt(query.page) || 1);
const skip = (page - 1) * take;
```

**2b.3 Prevent N+1 Queries**
```typescript
// CORRECT: Single query with all needed data
const tasks = await prisma.task.findMany({
  where: { userId, deletedAt: null },
  skip, take,
  orderBy: { createdAt: 'desc' }
});

// Return minimal fields (don't fetch description in list)
// Return: { id, title, status, priority, dueDate, createdAt }
```

**2b.4 Frontend Components (Simple)**
- `TaskList` - paginated list with status/priority badges
- `TaskItem` - task row with actions (edit, delete, mark complete)
- `TaskForm` - modal for create/edit task
- `StatusBadge` - visual indicator for pending/in-progress/done
- `PriorityBadge` - visual indicator for low/medium/high
- `EmptyState` - message when no tasks exist

**2b.5 State Management**
- Set up React Query in Phase 2b (NOT Context alone)
- React Query handles caching, refetching, mutations
- Minimal code, huge performance benefit
- Setup:
```typescript
// app/layout.tsx - Wrap with QueryClientProvider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000 }  // 5 min cache
  }
});
```

**Deliverables:**
- All CRUD API endpoints working
- Database queries optimized (no N+1)
- Task list displays with pagination
- Can add/edit/delete tasks from UI
- React Query properly caching API responses
- Basic input validation on client and server

**Success Criteria:**
- [ ] API endpoints return correct HTTP status codes
- [ ] Pagination works (20 tasks per page)
- [ ] Can create task via form
- [ ] Can edit task and see changes immediately
- [ ] Can delete task (soft delete, not removed from DB)
- [ ] Cannot see other users' tasks
- [ ] API responses < 200ms (with indexes)
- [ ] No N+1 queries (verify with Prisma logging)
- [ ] Task list loads < 1 second
- [ ] React Query caching working (requests don't repeat for same data)

---

### Phase 3: Filtering, Sorting & Polish (Days 9-10 / ~16 hours)
**Objective**: Add filtering, sorting, and UX polish (still simple scope)

**3.1 Filtering & Sorting (Simplified)**
- Filter by status (pending, in-progress, completed) - simple dropdown
- Filter by priority (high, medium, low) - checkboxes
- Filter by due date (overdue, due today, due this week, future) - quick buttons
- Sort options: created date (default) or due date
- Search by title (simple string match) - search input

NO advanced features: no complex date ranges, no multi-filter combinations, no saved filters

**3.2 UI/UX Polish**
- Visual feedback for task completion (strikethrough + disabled state)
- Loading states for async operations (spinners on buttons)
- Toast notifications for success/error messages (simple snackbar)
- Empty state message when no tasks exist
- Overdue tasks highlighted in red
- Responsive design for mobile/tablet

**3.3 Code Quality**
- Basic critical path tests only (40-50% coverage)
  - Test that CRUD operations work
  - Test that user isolation enforced
  - Test that filtering works
- Remove perfectionist tests (don't test React internals)
- TypeScript standard mode (not strict)

**NO Phase 3 features:**
- ❌ Drag-and-drop Kanban board (move to Phase 4)
- ❌ Keyboard shortcuts (move to Phase 4)
- ❌ Lazy-loading descriptions (just truncate in list view)
- ❌ Memoization/useCallback optimizations (not needed yet)
- ❌ 70% test coverage (aim for 40-50%)

**Deliverables:**
- Filter UI working (status, priority, due date)
- Sort functionality (created, due date)
- Search by title working
- Loading states and error messages
- Basic test coverage for critical paths
- Mobile responsive design

**Success Criteria:**
- [ ] Can filter by status, priority, due date
- [ ] Can sort by created date or due date
- [ ] Can search tasks by title
- [ ] Filter combinations work correctly
- [ ] Loading states show during API calls
- [ ] Error messages display on failures
- [ ] Mobile design works (test on phone-sized screen)
- [ ] Page loads in <1.5s
- [ ] API responses <200ms
- [ ] No console errors or warnings
- [ ] 40-50% test coverage (critical paths only)

---

### Phase 4: Deployment & Documentation (Days 11-14 / ~20 hours)
**Objective**: Production-ready deployment with essential documentation

**4.1 Production Setup**
- Set up PostgreSQL database (production vs. dev)
- Configure environment variables securely
- Add validation that enforces pagination (`take <= 100`)
- Verify all endpoints enforce user isolation

**4.2 Deployment**
- Deploy to Vercel (recommended: zero-config, automatic from GitHub)
- OR self-hosted Node.js with PM2
- Set up database backups (if self-hosted)
- Configure monitoring (optional: Sentry for error tracking)

**4.3 Documentation**
- Create README.md with:
  - Project overview
  - Quick start (how to set up locally)
  - Environment variables explained
  - How to deploy
  - Basic usage instructions
  - Known limitations
- That's it. No API.md, ARCHITECTURE.md, or CONTRIBUTING.md for MVP.

**NO Phase 4 features:**
- ❌ Rate limiting (single user doesn't need it)
- ❌ CI/CD pipeline (test locally, deploy manually)
- ❌ Multiple documentation files (just README)

**Deliverables:**
- App deployed and accessible online
- README.md with setup and deployment instructions
- Environment variables properly configured
- Database backups configured (if self-hosted)
- Instructions for local development

**Success Criteria:**
- [ ] App accessible at public URL
- [ ] Can sign up, login, and manage tasks in production
- [ ] Database persists data across restarts
- [ ] No console errors in production
- [ ] README clearly explains setup and deployment
- [ ] Deployment process documented for future updates

---

## Acceptance Criteria

### Functional Requirements (MVP)
- [ ] User can sign up with email and password
- [ ] User can login with email and password
- [ ] User can create tasks with title, description, priority, due date
- [ ] User can view all their tasks in paginated list (20 per page)
- [ ] User can filter tasks by status (pending, in-progress, completed)
- [ ] User can filter tasks by priority (low, medium, high)
- [ ] User can filter tasks by due date (overdue, due today, due this week, future)
- [ ] User can sort tasks by created date or due date
- [ ] User can search tasks by title
- [ ] User can edit task details
- [ ] User can mark tasks complete/incomplete (change status)
- [ ] User can delete tasks (soft delete - hidden from view but preserved in DB)
- [ ] User can see visual badges for priority and status
- [ ] Overdue tasks clearly highlighted

### Non-Functional Requirements
- [ ] API responds in <200ms for list queries (with pagination + indexes)
- [ ] Page Time to Interactive < 1.5 seconds
- [ ] First Contentful Paint < 1 second
- [ ] No N+1 queries in API endpoints (verify with Prisma logs)
- [ ] Database queries use proper indexes (userId, userId+status, userId+dueDate)
- [ ] All input validated on server (prevent invalid data)
- [ ] Proper HTTP status codes used (201, 204, 400, 404, 403)
- [ ] User isolation enforced (cannot access other users' tasks)
- [ ] Passwords hashed with bcryptjs (10+ rounds)
- [ ] JWT tokens expire appropriately

### Quality Gates
- [ ] Test coverage 40-50% (critical paths only)
- [ ] TypeScript standard mode passes (not strict)
- [ ] No console errors in production
- [ ] Mobile responsive (works on phones at 375px width)
- [ ] Basic accessibility (semantic HTML, sufficient color contrast)
- [ ] No sensitive data in API responses (no passwords/tokens in JSON)

---

## Success Metrics

**User Experience Metrics:**
- Time to add a new task: <15 seconds (user can create and submit)
- Time to mark task complete: <2 seconds (one click)
- Task list loads in <1 second

**Code Quality Metrics:**
- Test coverage: 40-50% (critical paths)
- TypeScript standard mode: 100% compliance (not strict)
- Zero production console errors
- Deployment successful first time (or documented setup issues)

**Performance Metrics:**
- First Contentful Paint: <1 second
- Time to Interactive: <1.5 seconds
- API responses: <200ms average
- Database query time: <100ms (with indexes)

---

## Dependencies & Prerequisites

### Required Knowledge
- JavaScript/TypeScript fundamentals
- React hooks and component patterns
- HTTP/REST concepts
- SQL or database fundamentals
- Git version control

### External Services (Optional)
- Vercel (for hosting)
- Clerk or Auth0 (for authentication, if extending)
- GitHub (for code repository)

### Development Tools
- Node.js 18+
- npm or yarn
- PostgreSQL (optional, uses SQLite initially)
- Git
- VS Code or similar editor

### NPM Dependencies
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "@tanstack/react-query": "^5.0.0",
  "axios": "^1.6.0"
}
```

---

## Risk Analysis & Mitigation

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database schema changes mid-project | Medium | High | Use Prisma migrations, version control schema |
| Authentication complexity delays project | Medium | Medium | Use simple JWT first, add Clerk later if needed |
| Performance issues with large task lists | Low | Medium | Implement pagination from start, use indexes |
| TypeScript strictness blocking progress | Low | Low | Gradually enable strict mode, use `any` temporarily if needed |
| Testing slows down development | Low | Low | Write tests incrementally, focus on critical paths first |

### Mitigation Strategies
1. **Schema changes**: Create migration at each step, test migrations locally first
2. **Auth complexity**: Start with simple token-based auth, upgrade later
3. **Performance**: Implement pagination and indexes in Phase 2, not Phase 3
4. **TypeScript**: Start in standard mode, gradually increase strictness
5. **Testing**: Write tests as you build features, not after

---

## Resource Requirements

### Team
- Solo developer (learning project) OR
- 1-2 developers (collaborative)

### Time Estimate
- Solo developer: 40-60 hours total
- 2 developers: 60-80 combined hours

### Infrastructure
- **Development**: Local SQLite database
- **Production**: PostgreSQL database + Node.js hosting
- **Optional**: Vercel for zero-config deployment

---

## Phase 5: Future Enhancements (Not in MVP Timeline)

**Do NOT implement in Phase 1-4. These are ideas for after MVP:**

- **Kanban board** with drag-and-drop status changes
- **Task categories** to organize by project/area
- **Keyboard shortcuts** (Cmd+K for quick add, Cmd+Enter to save)
- **Task comments** and activity history
- **File attachments** to tasks
- **Recurring tasks** (daily, weekly, monthly)
- **Task dependencies** (this task blocks that task)
- **Sharing** tasks with other users
- **Real-time updates** with WebSockets
- **Analytics dashboard** (tasks completed per week, productivity metrics)
- **Mobile app** (native iOS/Android)
- **Dark mode** theme support
- **Calendar view** showing tasks by due date

**Technical enhancements for later:**
- Database connection pooling
- Redis caching layer
- Search indexing (Elasticsearch)
- Email notifications for due tasks
- Webhook integrations
- API rate limiting
- Comprehensive error tracking (Sentry)
- Advanced testing (E2E tests with Playwright)

---

## Documentation Plan (MVP)

### README.md (Only documentation file for MVP)
Contains:
- Project overview (what this is, what it does)
- Quick start (how to set up and run locally)
- Installation instructions
- Environment variables and setup
- How to deploy to production
- Basic usage/features list
- Known limitations/not implemented
- Future ideas (link to Phase 5)
- Contributing guidelines (if accepting PRs)

**That's it.** No separate API.md, ARCHITECTURE.md, or CONTRIBUTING.md files for MVP.

Code is self-documenting. API endpoints are clear from looking at `app/api/tasks/route.ts`.

---

## References & Research

### Internal References
- Project structure: `/Users/andrejzadoroznyj/Downloads/Go_practice/Cursor + CC/Task Manager. CC/PROJECT.md`
- Similar projects in same directory for reference patterns

### External References

**Framework Documentation:**
- [Next.js Official Docs](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

**Best Practices:**
- [REST API Best Practices 2025](https://www.boltic.io/blog/rest-api-standards)
- [React Performance Optimization](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)
- [Testing React Applications](https://dev.to/learcise_health/a-complete-guide-to-react-testing-from-unit-tests-to-e2e-snapshots-and-test-doubles-31c3)

**Database Design:**
- [Task Manager Database Schema](https://www.back4app.com/tutorials/how-to-design-a-database-schema-for-a-task-and-to-do-list-management-app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

**Tutorials & Examples:**
- [Next.js Learn Course](https://nextjs.org/learn)
- [Building Task Apps - Medium](https://gabrielgomes61320.medium.com/building-a-task-management-app-from-scratch-part-1-choosing-the-tech-stack-24a03670c667)
- [React Task Manager on GitHub](https://github.com/topics/task-manager-app)

---

## Implementation Notes

### Key Files to Create
- `app/page.tsx` - Home page
- `app/layout.tsx` - Root layout with navigation
- `app/api/tasks/route.ts` - Task CRUD API
- `app/api/categories/route.ts` - Category API
- `app/components/TaskList.tsx` - Main task list
- `app/components/TaskForm.tsx` - Add/edit task
- `prisma/schema.prisma` - Database schema
- `lib/api.ts` - API client functions
- `__tests__/` - Test files directory

### Git Workflow
1. Create feature branches: `git checkout -b feature/task-crud`
2. Commit frequently with clear messages
3. Create meaningful commits that can be reverted individually
4. Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`

### Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm test             # Run tests
npx prisma migrate dev  # Create database migration
npx prisma studio   # Open Prisma data browser
```

---

## Summary

**Realistic Simplified Plan:**
- **Timeline:** 14-16 days (40-50 hours for solo developer)
- **Tech stack:** Next.js 15 + React 19 + Tailwind + Prisma (one choice, no alternatives)
- **Scope:** Simple task CRUD with auth, filtering, sorting, search
- **NOT in MVP:** Categories, Kanban board, keyboard shortcuts, keyboard shortcuts, comprehensive testing
- **Quality:** Clean code, indexed database, proper auth, pagination, 40-50% test coverage
- **Philosophy:** Do one thing well. Ship it. Enhance later.

**Phase Breakdown:**
1. **Phase 1** (8 hrs): Setup + database schema with indexes
2. **Phase 2a** (12 hrs): JWT authentication
3. **Phase 2b** (20 hrs): Task CRUD with React Query
4. **Phase 3** (16 hrs): Filtering, sorting, search, UI polish
5. **Phase 4** (20 hrs): Deployment + README documentation

**Total:** ~76 hours, but solo developer at 4-5 hrs/day = 14-16 days

**Key Success Factors:**
- Database indexes from Phase 1 (massive performance gain, 30-min setup)
- React Query in Phase 2 (enables caching, prevents unnecessary API calls)
- User isolation enforced at every step (security critical)
- Pagination enforced (scalability essential)
- Simple scope (no scope creep, deliver MVP first)

This is now a **truly simple, achievable learning project** that teaches full-stack fundamentals without over-engineering.
