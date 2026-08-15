# Production Todo & Time Management App — Specification

## 1. Project Overview

Build a **production-quality Todo and personal task-management web application** using only frontend technologies.

This is **not a tutorial/toy Todo application**. The application should demonstrate proper software engineering practices including:

- Modular architecture
- Separation of concerns
- Persistent data storage
- SQLite-based data modeling
- User/account segregation
- Task lifecycle management
- Time tracking
- Recurring tasks
- Deadline-based tasks
- Statistics and history
- Offline-first behavior
- Data validation
- Error handling
- Database migrations/versioning
- Import/export and backup
- Responsive and accessible UI

The application must be deployable as a static frontend on **Vercel**.

---

# 2. Core Constraint

The application must have **no traditional backend server**.

The architecture should be:

```text
Browser
   │
   ├── HTML
   ├── CSS
   └── Vanilla JavaScript
           │
           ▼
    Application Layer
           │
           ▼
      Repository Layer
           │
           ▼
         sql.js
           │
           ▼
     SQLite in WebAssembly
           │
           ▼
        IndexedDB
```

The application must run entirely inside the browser.

---

# 3. Tech Stack

## Required

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- ES Modules

Do **not** use:

- React
- Vue
- Angular
- Svelte
- jQuery
- Bootstrap
- Tailwind unless explicitly approved later

The goal is to build the application architecture using native web technologies.

### Database

Use:

- **SQLite**
- **sql.js**

Reference:

https://sql.js.org/

`sql.js` runs SQLite through WebAssembly inside the browser.

The SQLite database will exist in memory while the application is running.

### Persistent Browser Storage

Use:

- IndexedDB

IndexedDB should persist the serialized SQLite database between browser sessions.

Conceptually:

```text
Application startup

IndexedDB
    ↓
SQLite database bytes
    ↓
sql.js
    ↓
SQLite in memory
```

When data changes:

```text
SQLite in memory
    ↓
Serialize database
    ↓
IndexedDB
```

### Deployment

- Vercel
- Static frontend deployment

The application must not require a Node.js backend, Python backend, server, API server, Firebase, Supabase, or similar backend service.

---

# 4. Important Authentication Limitation

The application will have an **email + password account system** for user-based data segregation.

However, because this application has no backend, authentication is **local/browser-based authentication**, not server-side authentication.

This distinction is important.

The application should NOT claim to provide secure cloud authentication.

Accounts will exist inside the local SQLite database.

Example:

```text
User A
    ↓
Tasks belonging to User A

User B
    ↓
Tasks belonging to User B
```

When User A is logged in, only User A's data should be accessible through the application.

Passwords must never be stored as plaintext.

Use a browser-compatible password hashing approach. Prefer a Web Crypto API-based solution where practical.

Authentication should be designed behind an abstraction so that a future backend authentication system could replace the local implementation without rewriting the application.

---

# 5. Main Goal

The application should allow users to manage two fundamentally different types of tasks:

```text
Task
│
├── One-Time / Deadline Task
│
└── Recurring Task
```

The application must treat these as different task behaviors rather than simply adding a `recurring=true` flag to a generic Todo.

---

# 6. Task Type 1 — One-Time / Deadline Tasks

A one-time task is something that needs to be completed within a specified period.

Examples:

```text
Complete RAG project
Deadline: 3 days
Estimated time: 5 hours
```

```text
Submit college assignment
Deadline: 10 August, 6:00 PM
```

```text
Read research paper
Time requirement: 2 hours
Deadline: tomorrow
```

## Properties

A one-time task may contain:

- Title
- Description
- Start date/time
- Deadline
- Estimated duration
- Actual time spent
- Priority
- Category/project
- Tags
- Status
- Completion timestamp
- Notes

## Possible states

```text
Pending
In Progress
Completed
Overdue
Archived
```

The application should automatically identify overdue tasks based on their deadline.

---

# 7. Task Type 2 — Recurring Tasks

Recurring tasks represent activities that must be performed repeatedly.

Examples:

```text
DSA
Minimum: 1 hour
Frequency: Every day
```

```text
Gym
Minimum: 1 hour
Frequency: 4 times per week
```

```text
Weekly project review
Frequency: Every Sunday
Minimum: 30 minutes
```

## Recurrence types

Initially support:

- Daily
- Weekly
- Selected days of week

The architecture should allow future support for:

- Monthly
- Every X days
- Every X weeks
- Custom recurrence rules

---

# 8. Recurring Task Requirements

Each recurring task should define:

### Schedule

Example:

```text
Frequency: Daily
```

or:

```text
Frequency: Weekly
Days: Monday, Wednesday, Friday
```

### Minimum requirement

The user should be able to define either:

```text
Minimum duration:
60 minutes
```

or eventually:

```text
Minimum completion count:
3 times/week
```

For time-based recurring tasks, the UI should clearly show progress.

Example:

```text
DSA

43 / 60 minutes

████████████░░░░

71%
```

Once the minimum requirement is reached, the occurrence is considered completed.

---

# 9. Time Tracking

Time tracking is a core feature.

The application should allow users to record time spent on tasks.

For example:

```text
DSA

Required: 60 min
Completed: 43 min

[ Start Timer ]
[ Stop Timer ]
```

The timer should record:

- Start timestamp
- Stop timestamp
- Duration
- Associated task
- Associated user

A task can have multiple time sessions.

Example:

```text
DSA

09:00 → 09:25 = 25 min
18:00 → 18:35 = 35 min

Total = 60 min
```

Do not store only a single `total_time` field as the source of truth.

Time sessions should be stored separately.

Total duration should be calculated from sessions or maintained as a derived value.

---

# 10. Checkbox Behavior

Checkboxes should behave differently depending on task type.

## One-Time Task

Checkbox:

```text
☐ Complete RAG project
```

Checking it marks the task as completed.

## Recurring Task

The checkbox represents completion of the **current occurrence**, not permanent completion of the task.

Example:

```text
DSA
Monday      ☑
Tuesday     ☑
Wednesday   ☐
Thursday    ☐
```

The recurring task itself continues to exist.

---

# 11. Streaks

Recurring tasks should support streak tracking.

Example:

```text
DSA

🔥 12 day streak
```

A streak is based on successfully completing the required occurrence.

The implementation must correctly handle:

- Consecutive completed days
- Missed days
- Future dates
- Multiple completions
- Task creation date
- Recurrence schedule

Do not calculate streaks merely from the number of completed records.

---

# 12. Task Categories / Projects

Users should be able to organize tasks.

Examples:

```text
Projects

├── College
├── Work
├── DSA
├── Personal
└── Fitness
```

A task can belong to a project/category.

The architecture should allow categories/projects to be created, renamed, archived, and deleted.

Deleting a project must not accidentally delete its tasks unless explicitly requested.

---

# 13. Priority

Support:

```text
Low
Medium
High
Urgent
```

Priority should be usable for filtering and sorting.

---

# 14. Tags

Users should be able to assign multiple tags.

Example:

```text
DSA
#learning
#career
#daily
```

A task can have multiple tags.

Tags should be independently stored rather than duplicated as raw strings inside every task.

---

# 15. Dashboard

The application should have a dashboard showing useful information.

Possible sections:

### Today's Tasks

```text
Today

☑ DSA
☐ Complete API assignment
☐ Read research paper
```

### Time Progress

```text
Today's productive time

2h 35m
```

### Recurring Progress

```text
DSA       60/60 min  ✓
Reading   20/30 min  67%
Gym       Not started
```

### Streaks

```text
DSA       🔥 12 days
Reading   🔥 5 days
```

### Overdue Tasks

Show overdue one-time tasks prominently.

---

# 16. Calendar / History

Provide a historical view of activity.

The user should be able to see:

- Completed tasks
- Missed recurring tasks
- Time spent
- Daily productivity
- Streaks
- Task completion history

Example:

```text
August 2026

Mon Tue Wed Thu Fri Sat Sun
 ✓   ✓   ✓   ✗   ✓   ✓   ✓
```

Clicking a date should show the tasks and time sessions associated with that date.

---

# 17. Statistics

Provide basic productivity statistics.

Examples:

### Daily

```text
Tasks completed: 7
Time spent: 3h 20m
Recurring goals completed: 4/5
```

### Weekly

```text
Total time: 18h 40m
Tasks completed: 32
Average daily time: 2h 40m
```

### Task-specific

```text
DSA

Total time: 42h
Current streak: 12 days
Best streak: 31 days
Completion rate: 86%
```

Statistics should be derived from stored task and time-session data.

---

# 18. Search

Implement task search.

Search should initially support:

- Title
- Description
- Project
- Tags

Architecture should allow advanced search later.

Potential future syntax:

```text
priority:high
project:dsa
status:completed
due:today
tag:learning
```

Do not implement a complex query parser unless explicitly requested later.

---

# 19. Filtering and Sorting

Tasks should support filtering by:

- Task type
- Status
- Priority
- Project
- Tag
- Due date
- Completion status

Sorting options:

- Created date
- Due date
- Priority
- Alphabetical
- Manual order

---

# 20. Undo / Recovery

Destructive actions should support undo.

Examples:

```text
Task deleted.

[Undo]
```

```text
Task completed.

[Undo]
```

Avoid permanent deletion immediately where possible.

---

# 21. Archive

Tasks should preferably be archived instead of immediately destroyed.

Archived tasks should not appear in normal task lists.

Users should be able to view archived tasks separately.

---

# 22. Data Import / Export

Because the application is frontend-only, users must have control over their data.

Support:

### Export

Export the user's data into a portable format.

Preferred initial format:

```text
JSON
```

The export should include:

- User data necessary for restoration
- Tasks
- Projects
- Tags
- Recurrences
- Time sessions
- Settings
- Schema version

Example:

```json
{
  "schema_version": 1,
  "exported_at": "...",
  "data": {}
}
```

### Import

Validate imported data before modifying the current database.

Never blindly insert imported data.

---

# 23. Database Architecture

Use SQLite as the application's persistent data model.

Potential initial entities:

```text
users
tasks
task_occurrences
time_sessions
projects
tags
task_tags
recurrence_rules
user_settings
```

The exact schema should be designed before implementation.

Every user-owned entity should contain a clear relationship to the owning user where appropriate.

Example:

```text
users
  │
  ├── tasks
  ├── projects
  ├── tags
  └── settings
```

Do not rely solely on frontend filtering for conceptual ownership. The database schema itself should represent relationships clearly.

---

# 24. Recurring Task Architecture

Do not create a completely new task every time a recurring task occurs.

Prefer separating:

```text
Recurring Task Definition
        │
        ├── Occurrence 1
        ├── Occurrence 2
        ├── Occurrence 3
        └── ...
```

For example:

```text
tasks
    ↓
DSA

task_occurrences
    ↓
2026-08-06
2026-08-07
2026-08-08
...
```

This allows historical tracking without duplicating the task definition.

---

# 25. Database Persistence

`sql.js` databases are in-memory.

Therefore persistence must be implemented.

### Startup

```text
Open IndexedDB
      ↓
Check for existing database
      ↓
If found:
    Load SQLite bytes
Else:
    Create new SQLite database
      ↓
Initialize schema
      ↓
Run migrations
```

### Save

After a database-changing operation:

```text
SQLite
  ↓
db.export()
  ↓
Uint8Array
  ↓
IndexedDB
```

Persistence should be reliable and centralized.

Do not scatter IndexedDB operations throughout UI code.

---

# 26. Repository Layer

UI code must not directly execute arbitrary SQL.

Use a repository/data-access layer.

Example conceptual structure:

```text
UI
 ↓
TaskService
 ↓
TaskRepository
 ↓
DatabaseManager
 ↓
sql.js
```

This keeps database implementation separate from application logic.

---

# 27. Application Services

Business logic should live outside UI components.

Possible services:

```text
AuthService
TaskService
RecurringTaskService
TimeTrackingService
StatisticsService
ExportService
ImportService
SettingsService
```

The exact structure may change during implementation.

The important requirement is:

> UI code should coordinate actions, not contain business logic.

---

# 28. Authentication Flow

Initial flow:

```text
Register
   ↓
Validate email/password
   ↓
Hash password
   ↓
Create user
   ↓
Login
   ↓
Verify credentials
   ↓
Create local session
   ↓
Load user's data
```

Logout should clear the active session.

The application should never expose another user's tasks in the UI.

If multiple local users exist, switching accounts should correctly switch the active data context.

---

# 29. Session Handling

Since there is no backend, the session is local.

A lightweight local session mechanism can identify the currently active user.

However:

- Never store plaintext passwords in localStorage.
- Never treat local authentication as server-grade security.
- Keep authentication logic isolated.
- Do not put passwords into task records or unrelated tables.

---

# 30. Responsive Design

The application must work on:

- Desktop
- Tablet
- Mobile

Desktop can use a multi-column layout.

Mobile should have a simplified navigation system.

Do not merely shrink the desktop UI.

Design mobile interactions intentionally.

---

# 31. Accessibility

The application should follow good accessibility practices.

Requirements:

- Semantic HTML
- Proper labels
- Keyboard navigation
- Visible focus states
- Accessible buttons
- Accessible form validation
- Appropriate ARIA only where necessary
- Sufficient contrast
- Do not rely only on color to communicate status

All major functionality should be usable without a mouse.

---

# 32. Keyboard Shortcuts

Consider supporting:

```text
N       New task
E       Edit selected task
Enter   Toggle completion
Delete  Delete/archive
/       Search
Esc     Close modal
```

Shortcuts should not interfere with normal text input.

---

# 33. PWA / Offline Support

The application should eventually support:

- Service worker
- Application caching
- Offline loading
- Installable PWA

The core task functionality should work without an internet connection after the application has been loaded/cached.

---

# 34. Theme

Support:

- Light mode
- Dark mode
- System preference

User preference should be persisted.

---

# 35. Error Handling

The application must gracefully handle:

- Database initialization failure
- IndexedDB failure
- Corrupted database data
- Invalid imported files
- Invalid task data
- Failed persistence
- Timer errors
- Invalid authentication input

Never silently swallow important errors.

User-facing errors should be understandable.

Technical details should be available through development logging.

---

# 36. Database Versioning / Migrations

The SQLite schema must have a version.

Example:

```text
Schema v1
    ↓
Schema v2
    ↓
Schema v3
```

When the application starts:

```text
Read current schema version
        ↓
Determine required migrations
        ↓
Run migrations sequentially
        ↓
Update schema version
```

Do not modify existing production tables destructively without a migration.

---

# 37. Security Principles

Even though this is a local-only application:

- Never store plaintext passwords.
- Validate all user input.
- Avoid unsafe HTML injection.
- Never use `innerHTML` with untrusted user content without sanitization.
- Use parameterized SQL queries.
- Do not dynamically concatenate user input into SQL.
- Do not expose database internals unnecessarily.
- Do not store secrets/API keys in the frontend.
- Do not claim that local authentication provides cloud-level security.

---

# 38. Performance

The application should remain responsive with a large number of tasks.

The architecture should reasonably support:

- Thousands of tasks
- Thousands of time sessions
- Large task histories

Avoid unnecessarily re-rendering the entire application after every change.

Database queries should retrieve only the required information.

Search and filtering should be efficient.

---

# 39. Project Structure

The exact structure may evolve, but maintain clear separation.

A possible starting structure:

```text
/
├── index.html
├── assets/
│
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   │
│   ├── core/
│   │   ├── database.js
│   │   ├── migrations.js
│   │   ├── storage.js
│   │   └── session.js
│   │
│   ├── auth/
│   │   ├── auth-service.js
│   │   └── password.js
│   │
│   ├── repositories/
│   │   ├── task-repository.js
│   │   ├── user-repository.js
│   │   ├── project-repository.js
│   │   └── time-repository.js
│   │
│   ├── services/
│   │   ├── task-service.js
│   │   ├── recurrence-service.js
│   │   ├── timer-service.js
│   │   ├── statistics-service.js
│   │   └── export-service.js
│   │
│   ├── ui/
│   │   ├── components/
│   │   ├── views/
│   │   └── modals/
│   │
│   └── utils/
│
├── db/
│   └── migrations/
│
├── manifest.json
└── service-worker.js
```

This is an initial guideline, not a rigid requirement.

---

# 40. UI Philosophy

The UI should be:

- Clean
- Fast
- Minimal
- Professional
- Information-dense without being cluttered
- Responsive

Avoid the typical "Todo tutorial" appearance.

The application should feel like a real productivity product.

---

# 41. Example User Workflow

A user registers:

```text
Email: user@example.com
Password: ********
```

After login:

```text
Dashboard
```

They create:

### One-time task

```text
Task:
Complete RAG project

Deadline:
10 August

Estimated time:
5 hours

Priority:
High
```

Then create a recurring task:

```text
Task:
DSA

Frequency:
Every day

Minimum:
1 hour
```

During the day:

```text
DSA
43 / 60 minutes

[Stop Timer]
```

After another session:

```text
DSA
60 / 60 minutes ✓

🔥 12 day streak
```

The next day, a new occurrence appears:

```text
DSA
0 / 60 minutes
```

The underlying recurring task remains the same.

---

# 42. Future Features

Do not implement these initially unless explicitly requested, but design the architecture so they can be added.

Potential future features:

- Cloud synchronization
- Real server-side authentication
- Multiple devices
- Google OAuth
- Notifications
- Browser notifications
- Email reminders
- Calendar integration
- Natural-language task creation
- Advanced recurrence rules
- Pomodoro mode
- Focus sessions
- Collaboration
- Shared projects
- Task dependencies
- Attachments
- Rich text descriptions
- Advanced analytics

The current architecture should not make these future additions unnecessarily difficult.

---

# 43. Development Principles

The coding agent must follow these principles:

### 1. Do not over-engineer prematurely

Implement the simplest architecture that satisfies the requirements.

### 2. Keep responsibilities separated

Do not mix:

```text
SQL
business logic
DOM manipulation
authentication
and styling
```

inside one file.

### 3. Prefer reusable modules

Avoid giant JavaScript files.

### 4. Validate boundaries

Validate:

- Forms
- Database inputs
- Imported data
- Authentication data
- Recurrence configuration

### 5. Use transactions where appropriate

Operations that modify multiple related SQLite tables should use SQLite transactions.

Example:

```text
Create recurring task
    ↓
Create task
    ↓
Create recurrence rule
    ↓
Commit
```

If something fails:

```text
Rollback
```

### 6. Preserve user data

Data integrity is more important than UI convenience.

---

# 44. Definition of "Production-Level"

For this project, production-level does NOT mean building a massive enterprise system.

It means:

- Proper architecture
- Persistent storage
- Reliable data model
- Correct task semantics
- Good UX
- Good error handling
- Data recovery
- Validation
- Accessibility
- Responsive design
- Maintainable code
- Clear separation of concerns
- Reasonable performance
- No obvious security mistakes
- Proper testing

The application should be something that could realistically be used as a personal productivity tool rather than a demonstration of basic DOM manipulation.

---

# 45. Current Scope

The first major version should focus on:

```text
Authentication
        +
Two task types
        +
SQLite persistence
        +
Time tracking
        +
Recurring tasks
        +
Deadlines
        +
Projects/categories
        +
Tags
        +
Priorities
        +
Dashboard
        +
History
        +
Statistics
        +
Import/export
        +
Responsive UI
        +
Offline capability
```

Do not begin implementing every future feature immediately.

First establish a strong foundation for:

```text
Database
   ↓
Repositories
   ↓
Services
   ↓
Application State
   ↓
UI
```

Then build features incrementally on top of that foundation.

---

# 46. Non-Goals

The initial version must NOT include:

- Backend API
- Firebase
- Supabase
- Hosted database
- Server-side authentication
- React/Vue/Angular
- Microservices
- External API dependencies unless explicitly approved

The application should remain a **self-contained frontend application using SQLite through sql.js**.

---

# 47. Final Architectural Goal

The final application should conceptually look like:

```text
                         VERCEL
                           │
                           ▼
                    Static Web App
                           │
             ┌─────────────┴─────────────┐
             │                           │
            UI                     Application Logic
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                         Auth Service         Task Services
                              │                     │
                              └──────────┬──────────┘
                                         │
                                  Repository Layer
                                         │
                                  Database Manager
                                         │
                                      sql.js
                                         │
                                  SQLite / WASM
                                         │
                                    IndexedDB
```

The central principle is:

> **Build a real task-management application, not a CRUD Todo demo.**

The application should prioritize correctness, maintainability, data integrity, and user experience while remaining completely frontend-only.