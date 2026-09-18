# PM System — API Reference

**Base URL:** `https://pm-system.darshanvadher.com`  
**Format:** All requests and responses use `application/json` unless noted (file upload uses `multipart/form-data`).  
**Auth:** Session-based. A valid session cookie (`pm_session`) must be present on every protected request. Obtain it by calling `POST /api/auth/login`.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Roles](#3-roles)
4. [Clients](#4-clients)
5. [Projects](#5-projects)
6. [Tasks](#6-tasks)
7. [Bugs / Issues](#7-bugs--issues)
8. [Sprints](#8-sprints)
9. [Time Logs](#9-time-logs)
10. [File Upload](#10-file-upload)
11. [Notifications](#11-notifications)
12. [Client Updates (Portal)](#12-client-updates-portal)
13. [Team & Workload](#13-team--workload)
14. [Reports & Analytics](#14-reports--analytics)
15. [Audit Trail](#15-audit-trail)
16. [Global Search](#16-global-search)
17. [Authorization Model](#17-authorization-model)
18. [Error Reference](#18-error-reference)

---

## 1. Authentication

### POST /api/auth/login

Authenticates a user and sets the `pm_session` cookie on success. No authentication required.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Case-insensitive, trimmed |
| `password` | string | ✅ | |

```json
{
  "email": "admin@pm-system.test",
  "password": "Password123!"
}
```

**Response `200 OK`**

```json
{
  "user": {
    "id": "cmu54n7jd000gf0ry41cwoq66",
    "name": "Ava Admin",
    "email": "admin@pm-system.test"
  }
}
```

**Error responses**

| Status | Condition |
|---|---|
| `400` | Missing or invalid email/password format |
| `401` | Wrong credentials (same message for unknown email and wrong password — by design, to prevent email enumeration) |
| `403` | Account is deactivated |

---

### POST /api/auth/logout

Destroys the current session and clears the cookie. Requires an active session.

**Response `200 OK`**

```json
{ "success": true }
```

---

### GET /api/auth/session

Returns the current user. Useful for client-side "am I logged in?" checks.

**Response `200 OK`** (logged in)

```json
{
  "user": {
    "id": "cmu54n7jd000gf0ry41cwoq66",
    "name": "Ava Admin",
    "email": "admin@pm-system.test",
    "role": "ADMIN"
  }
}
```

**Response `200 OK`** (not logged in)

```json
{ "user": null }
```

---

## 2. Users

All endpoints require the `user:manage` permission (ADMIN only).

### GET /api/users

Returns all users ordered by creation date (newest first).

**Response `200 OK`**

```json
{
  "users": [
    {
      "id": "cmu54n7jd000gf0ry41cwoq66",
      "email": "admin@pm-system.test",
      "name": "Ava Admin",
      "isActive": true,
      "createdAt": "2026-09-17T06:54:28.000Z",
      "role": { "id": "abc123", "name": "ADMIN" }
    }
  ]
}
```

---

### POST /api/users

Creates a new user account.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Must be unique |
| `name` | string | ✅ | Max 200 chars |
| `password` | string | ✅ | Min 8 chars |
| `roleName` | string | ✅ | One of: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `CLIENT` |

```json
{
  "email": "jane@example.com",
  "name": "Jane Smith",
  "password": "SecurePass1!",
  "roleName": "DEVELOPER"
}
```

**Response `201 Created`** — same shape as a single user in the list above.

**Error responses**

| Status | Condition |
|---|---|
| `400` | Validation failure or unknown roleName |
| `409` | Email already in use |

---

### GET /api/users/:id

Returns a single user by ID. `404` if not found.

---

### PATCH /api/users/:id

Updates a user. All fields optional — send only what needs to change.

**Request body**

| Field | Type | Notes |
|---|---|---|
| `name` | string | Max 200 chars |
| `roleName` | string | One of the four role names |
| `isActive` | boolean | `false` = soft-deactivate |

> **Self-edit restriction:** You cannot change your own `roleName` or `isActive`. Returns `400`.

**Response `200 OK`** — updated user object.

---

### DELETE /api/users/:id

**Soft-deletes** the user (`isActive: false`). Row is preserved to keep task/project history intact. Cannot delete your own account.

**Response `200 OK`** — updated user object with `isActive: false`.

---

## 3. Roles

Requires `role:manage` permission (ADMIN only). Read-only.

### GET /api/roles

```json
{
  "roles": [
    {
      "id": "abc123",
      "name": "ADMIN",
      "permissions": ["client:manage", "project:create", "role:manage", "user:manage"]
    }
  ]
}
```

---

## 4. Clients

Requires `client:manage` permission (ADMIN and PROJECT_MANAGER).

### GET /api/clients

Returns all clients ordered by creation date.

```json
{
  "clients": [
    {
      "id": "clnt001",
      "name": "Acme Corp",
      "contactEmail": "hello@acme.com",
      "contactPhone": "+1 555 123 4567",
      "notes": "Enterprise account",
      "isActive": true,
      "createdAt": "2026-09-17T10:00:00.000Z",
      "updatedAt": "2026-09-17T10:00:00.000Z"
    }
  ]
}
```

---

### POST /api/clients

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Max 200 chars |
| `contactEmail` | string | — | |
| `contactPhone` | string | — | Max 50 chars |
| `notes` | string | — | Max 2000 chars |

**Response `201 Created`** — the created client object.

---

### GET /api/clients/:id

Returns a single client. `404` if not found.

---

### PATCH /api/clients/:id

All fields optional. Setting `isActive: false` deactivates the client.

**Response `200 OK`** — updated client object.

---

### DELETE /api/clients/:id

Soft-deactivates (`isActive: false`). Projects linked to this client are unaffected.

**Response `200 OK`** — updated client with `isActive: false`.

---

## 5. Projects

### GET /api/projects

Requires `project:view`.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `status` | string | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED` |
| `search` | string | Case-insensitive search across name, code, description |

**Response `200 OK`**

```json
{
  "projects": [
    {
      "id": "proj001",
      "name": "Nexus Cloud Dashboard",
      "code": "NEXUS",
      "description": "...",
      "status": "ACTIVE",
      "startDate": "2026-09-01T00:00:00.000Z",
      "endDate": null,
      "clientId": "clnt001",
      "client": { "id": "clnt001", "name": "Acme Corp" },
      "members": [
        { "userId": "...", "role": "MANAGER", "user": { "id": "...", "name": "...", "email": "..." } }
      ],
      "milestones": [ { "id": "...", "title": "...", "status": "OPEN", "dueDate": null } ],
      "tasks": [ { "id": "...", "status": "TODO" } ],
      "createdAt": "2026-09-17T10:00:00.000Z",
      "updatedAt": "2026-09-17T10:00:00.000Z"
    }
  ]
}
```

---

### POST /api/projects

Requires `project:create`. Creator is automatically added as `MANAGER` member.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `code` | string | ✅ | Unique short identifier e.g. `NEXUS` |
| `description` | string | — | |
| `status` | string | — | Default: `PLANNING` |
| `startDate` | string (ISO 8601) | — | |
| `endDate` | string (ISO 8601) | — | |
| `clientId` | string | — | Must reference an existing client |

**Response `201 Created`** — full project object.  
**`400`** if `code` is already taken.

---

### GET /api/projects/:id

Requires `project:view`. Returns the full project including all tasks, members, milestones, sprints, and tags.

---

### PATCH /api/projects/:id

Requires `project:update`. All fields optional.

---

### DELETE /api/projects/:id

Requires `project:delete`. **Hard-deletes** the project and all related records (tasks, sprints, milestones, files, etc.).

**Response `200 OK`** — `{ "success": true }`

---

## 6. Tasks

### GET /api/tasks

Requires `task:view`.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `projectId` | string | Filter by project |
| `assigneeId` | string | Filter by assignee |
| `status` | string | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `priority` | string | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `search` | string | Searches title, taskKey, description |

**Response `200 OK`**

```json
{
  "tasks": [
    {
      "id": "task001",
      "taskKey": "NEXUS-1",
      "title": "Build authentication module",
      "description": "...",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "type": "TASK",
      "storyPoints": 5,
      "estimatedHours": 8.0,
      "position": 1.0,
      "projectId": "proj001",
      "milestoneId": null,
      "sprintId": null,
      "assigneeId": "user001",
      "reporterId": "user002",
      "dueDate": "2026-10-01T00:00:00.000Z",
      "project": { "id": "proj001", "name": "Nexus Cloud Dashboard", "code": "NEXUS" },
      "assignee": { "id": "user001", "name": "Dev Developer", "email": "dev@pm-system.test" },
      "reporter": { "id": "user002", "name": "Priya Manager", "email": "pm@pm-system.test" },
      "tags": [ { "tag": { "id": "tag001", "name": "backend", "color": "#6366f1" } } ],
      "_count": { "comments": 2, "attachments": 0 },
      "createdAt": "2026-09-17T10:00:00.000Z",
      "updatedAt": "2026-09-17T10:00:00.000Z"
    }
  ]
}
```

---

### POST /api/tasks

Requires `task:create`. Auto-generates `taskKey` (e.g. `NEXUS-1`). Sets the current user as reporter.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | |
| `projectId` | string | ✅ | |
| `description` | string | — | |
| `status` | string | — | Default: `TODO` |
| `priority` | string | — | Default: `MEDIUM` |
| `milestoneId` | string | — | |
| `assigneeId` | string | — | |
| `dueDate` | string (ISO 8601) | — | |
| `tagNames` | string[] | — | Tags are upserted by name |

**Response `201 Created`** — full task with activities, comments, attachments.

---

### GET /api/tasks/:id

Requires `task:view`. Returns the task with all comments, attachments, and activity history.

---

### PATCH /api/tasks/:id

Requires `task:update`. All fields optional. Changes to `status`, `priority`, `assigneeId`, and `title` are automatically logged to the activity trail.

**Request body** — same optional fields as POST (excluding `projectId`).

**Response `200 OK`** — full updated task object.

---

### DELETE /api/tasks/:id

Requires `task:delete`. Hard-deletes the task and all related records.

**Response `200 OK`** — `{ "success": true }`

---

## 7. Bugs / Issues

Bugs are tasks with `type: "BUG"`. They carry an additional `severity` field and receive task keys in the format `NEXUS-BUG-1`.

### GET /api/bugs

Requires `task:view`.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `projectId` | string | Filter by project |
| `severity` | string | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `status` | string | Same values as tasks |
| `search` | string | Searches title, taskKey, description |

**Response `200 OK`** — `{ "bugs": [ ...task objects with type "BUG"... ] }`

---

### POST /api/bugs

Requires `task:create`. `type` is automatically set to `BUG`.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | |
| `projectId` | string | ✅ | |
| `severity` | string | — | Default: `HIGH`. One of: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `priority` | string | — | Default: `HIGH` |
| `description` | string | — | |
| `assigneeId` | string | — | |
| `dueDate` | string (ISO 8601) | — | |

**Response `201 Created`** — the created bug object.

---

## 8. Sprints

Sprints are created and listed through the Projects API (`POST /api/projects/:id/sprints`, `GET /api/projects/:id`). The endpoints below cover update and delete.

### PATCH /api/sprints/:id

Requires `project:update`.

**Request body** (all optional)

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `goal` | string | |
| `startDate` | string (ISO 8601) | |
| `endDate` | string (ISO 8601) | |
| `status` | string | `PLANNED`, `ACTIVE`, `COMPLETED` |

**Response `200 OK`** — updated sprint with its tasks.

---

### DELETE /api/sprints/:id

Requires `project:update`. Hard-deletes the sprint; tasks have their `sprintId` cleared automatically.

**Response `200 OK`** — `{ "success": true }`

---

## 9. Time Logs

Time logs are created via `POST /api/tasks/:id/time-logs`. This endpoint handles deletion only.

### DELETE /api/time-logs/:id

Requires `task:update`. Only the log owner or ADMIN/PROJECT_MANAGER can delete.

**Response `200 OK`** — `{ "success": true }`

| Status | Condition |
|---|---|
| `403` | Caller is not the owner and lacks ADMIN/PM role |
| `404` | Time log not found |

---

## 10. File Upload

### POST /api/upload

Requires an active session. Accepts `multipart/form-data`.

**Form field**

| Field | Type | Required |
|---|---|---|
| `file` | File (binary) | ✅ |

**Response `201 Created`**

```json
{
  "url": "/uploads/1726574400000_report.pdf",
  "fileName": "report.pdf",
  "fileSize": 204800,
  "fileType": "application/pdf"
}
```

Use the returned `url` when creating a project file record.

---

## 11. Notifications

### GET /api/notifications

Returns the current user's 50 most recent notifications.

**Response `200 OK`**

```json
{
  "unreadCount": 3,
  "notifications": [
    {
      "id": "notif001",
      "userId": "user001",
      "title": "Task Assigned",
      "message": "You have been assigned NEXUS-3",
      "type": "TASK_ASSIGNED",
      "link": "/projects/proj001/kanban",
      "isRead": false,
      "createdAt": "2026-09-17T12:00:00.000Z"
    }
  ]
}
```

**Notification types:** `TASK_ASSIGNED`, `STATUS_CHANGED`, `COMMENT_ADDED`, `CLIENT_UPDATE`, `SYSTEM`

---

### PATCH /api/notifications

Marks **all** of the current user's unread notifications as read.

**Response `200 OK`** — `{ "success": true }`

---

### PATCH /api/notifications/:id

Marks a single notification as read. Only the owner can call this.

**Response `200 OK`** — `{ "notification": { ...updated notification... } }`

---

## 12. Client Updates (Portal)

Client updates are progress reports published by PMs to client users.

### GET /api/client-updates

Requires `project:view`. CLIENT-role users only see `PUBLISHED`, `APPROVED`, and `REJECTED` updates for their linked client's projects.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `projectId` | string | Filter by project |

**Response `200 OK`**

```json
{
  "updates": [
    {
      "id": "upd001",
      "projectId": "proj001",
      "authorId": "user002",
      "title": "Sprint 1 Complete",
      "summary": "All planned features delivered.",
      "content": "Detailed content...",
      "status": "PUBLISHED",
      "clientFeedback": null,
      "publishedAt": "2026-09-17T14:00:00.000Z",
      "approvedAt": null,
      "project": { "id": "proj001", "name": "Nexus Cloud Dashboard", "code": "NEXUS" },
      "author": { "id": "user002", "name": "Priya Manager", "email": "pm@pm-system.test" },
      "createdAt": "2026-09-17T13:00:00.000Z",
      "updatedAt": "2026-09-17T14:00:00.000Z"
    }
  ]
}
```

---

### POST /api/client-updates

Requires `project:update`. Publishing (`status: "PUBLISHED"`) triggers in-app notifications and email to all linked client users.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `projectId` | string | ✅ | |
| `title` | string | ✅ | |
| `content` | string | ✅ | Full update body |
| `summary` | string | — | Short preview text |
| `status` | string | — | `DRAFT` or `PUBLISHED`. Default: `DRAFT` |

**Response `201 Created`** — the created update object.

---

### PATCH /api/client-updates/:id

Behaviour differs by caller role:

**CLIENT role** — submit feedback/approval:

| Field | Type | Required | Notes |
|---|---|---|---|
| `action` | string | ✅ | `APPROVE` or `REJECT` |
| `clientFeedback` | string | — | Optional comment |

**ADMIN / PROJECT_MANAGER** — edit content or change status:

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `summary` | string | |
| `content` | string | |
| `status` | string | `DRAFT` → `PUBLISHED` triggers notifications |

**Response `200 OK`** — `{ "update": { ...updated object... } }`

---

### DELETE /api/client-updates/:id

ADMIN, PROJECT_MANAGER, or the original author can delete. Hard-deletes.

**Response `200 OK`** — `{ "success": true }`

---

## 13. Team & Workload

### GET /api/team/workload

Requires `user:manage` permission (ADMIN and PROJECT_MANAGER).

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `projectId` | string | Scope workload to a specific project |

**Response `200 OK`**

```json
{
  "workloads": [
    {
      "id": "user001",
      "name": "Dev Developer",
      "email": "dev@pm-system.test",
      "roleName": "DEVELOPER",
      "totalAssignedTasks": 5,
      "activeTaskCount": 3,
      "totalEstimatedHours": 24.0,
      "totalLoggedHours": 10.5,
      "capacityStatus": "OPTIMAL",
      "tasks": [ { "...full task objects..." } ]
    }
  ]
}
```

**`capacityStatus` values:**

| Value | Condition |
|---|---|
| `AVAILABLE` | Fewer than 3 active tasks |
| `OPTIMAL` | 3–7 active tasks and ≤ 40 estimated hours |
| `OVERLOADED` | More than 7 active tasks or > 40 estimated hours |

---

### POST /api/team/reassign

Requires `task:update`. Reassigns a task and logs the change to the activity trail.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `taskId` | string | ✅ | |
| `targetUserId` | string \| null | ✅ | Pass `null` to unassign |

**Response `200 OK`**

```json
{
  "task": {
    "id": "task001",
    "assignee": { "id": "user003", "name": "Jane Smith", "email": "jane@example.com" }
  }
}
```

---

## 14. Reports & Analytics

### GET /api/reports/analytics

Requires `project:view`. Returns KPIs, sprint velocity, task distribution, and bug analytics.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `projectId` | string | Scope to a single project; omit for system-wide |

**Response `200 OK`**

```json
{
  "kpis": {
    "totalProjects": 1,
    "totalTasks": 5,
    "completedTasks": 1,
    "openBugs": 1,
    "resolvedBugs": 0,
    "totalLoggedHours": 14.5,
    "totalEstimatedHours": 32.0,
    "totalMilestones": 2,
    "completedMilestones": 0,
    "approvedClientUpdates": 0
  },
  "sprintVelocity": [
    {
      "id": "sprint001",
      "name": "Sprint 1",
      "status": "ACTIVE",
      "projectCode": "NEXUS",
      "totalPoints": 21,
      "completedPoints": 5,
      "completionRate": 24
    }
  ],
  "taskDistribution": {
    "byStatus": { "TODO": 2, "IN_PROGRESS": 2, "IN_REVIEW": 0, "DONE": 1 },
    "byPriority": { "LOW": 0, "MEDIUM": 1, "HIGH": 3, "URGENT": 1 }
  },
  "bugAnalytics": {
    "totalBugs": 1,
    "resolvedBugs": 0,
    "bySeverity": { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 0, "LOW": 0 },
    "resolutionRate": 0
  }
}
```

---

### GET /api/reports/time

Requires `project:view`. Returns detailed time log data and estimated-vs-actual hours per task.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `projectId` | string | Filter by project |
| `userId` | string | Filter by team member |

**Response `200 OK`**

```json
{
  "totalLoggedHours": 14.5,
  "totalEstimatedHours": 32.0,
  "timeLogs": [
    {
      "id": "log001",
      "hours": 2.5,
      "date": "2026-09-17T00:00:00.000Z",
      "description": "Worked on auth module",
      "task": {
        "id": "task001",
        "taskKey": "NEXUS-1",
        "title": "Build auth",
        "estimatedHours": 8.0,
        "project": { "id": "proj001", "name": "Nexus Cloud Dashboard", "code": "NEXUS" }
      },
      "user": { "id": "user001", "name": "Dev Developer", "email": "dev@pm-system.test" }
    }
  ],
  "tasksSummary": [
    {
      "id": "task001",
      "taskKey": "NEXUS-1",
      "title": "Build auth",
      "estimatedHours": 8.0,
      "loggedHours": 2.5,
      "status": "IN_PROGRESS",
      "project": { "id": "proj001", "name": "Nexus Cloud Dashboard", "code": "NEXUS" }
    }
  ]
}
```

---

## 15. Audit Trail

### GET /api/audit

Requires `project:view`. Returns task activity logs, comments, and client updates in reverse chronological order.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `projectId` | string | Scope to a project |
| `userId` | string | Filter by acting user |
| `action` | string | One of: `CREATED`, `STATUS_CHANGE`, `ASSIGNEE_CHANGE`, `PRIORITY_CHANGE`, `COMMENT_ADDED`, `ATTACHMENT_ADDED`, `UPDATED`, `TIME_LOGGED` |
| `limit` | integer | Max activity logs returned (default: 100) |

**Response `200 OK`**

```json
{
  "activities": [
    {
      "id": "act001",
      "action": "STATUS_CHANGE",
      "field": "status",
      "oldValue": "TODO",
      "newValue": "IN_PROGRESS",
      "createdAt": "2026-09-17T11:00:00.000Z",
      "task": {
        "id": "task001",
        "taskKey": "NEXUS-1",
        "title": "Build auth",
        "project": { "id": "proj001", "name": "Nexus Cloud Dashboard", "code": "NEXUS" }
      },
      "user": { "id": "user001", "name": "Dev Developer", "email": "dev@pm-system.test" }
    }
  ],
  "comments": [
    {
      "id": "cmt001",
      "content": "Implemented JWT rotation",
      "createdAt": "2026-09-17T12:00:00.000Z",
      "task": {
        "id": "task001", "taskKey": "NEXUS-1", "title": "Build auth",
        "project": { "id": "proj001", "name": "Nexus Cloud Dashboard", "code": "NEXUS" }
      },
      "author": { "id": "user001", "name": "Dev Developer", "email": "dev@pm-system.test" }
    }
  ],
  "clientUpdates": [ { "...client update objects..." } ]
}
```

---

## 16. Global Search

### GET /api/search

Requires `project:view`. Searches across all resource types in a single request.

**Query parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Search query (min 1 char) |
| `limit` | integer | — | Max results per category (default: 20) |

**Response `200 OK`**

```json
{
  "projects":     [ { "id": "...", "name": "...", "code": "...", "status": "..." } ],
  "tasks":        [ { "id": "...", "taskKey": "...", "title": "...", "status": "...", "priority": "...", "project": { "..." } } ],
  "bugs":         [ { "id": "...", "taskKey": "...", "title": "...", "severity": "...", "status": "...", "project": { "..." } } ],
  "sprints":      [ { "id": "...", "name": "...", "status": "...", "project": { "..." } } ],
  "files":        [ { "id": "...", "name": "...", "filePath": "...", "category": "...", "project": { "..." } } ],
  "clientUpdates":[ { "id": "...", "title": "...", "status": "...", "project": { "..." } } ]
}
```

If `q` is empty, all arrays are returned empty.

---

## 17. Authorization Model

### Roles and permissions

| Permission | ADMIN | PROJECT_MANAGER | DEVELOPER | CLIENT |
|---|:---:|:---:|:---:|:---:|
| `user:manage` | ✅ | — | — | — |
| `role:manage` | ✅ | — | — | — |
| `client:manage` | ✅ | ✅ | — | — |
| `project:create` | ✅ | ✅ | — | — |
| `project:update` | ✅ | ✅ | — | — |
| `project:delete` | ✅ | ✅ | — | — |
| `project:view` | ✅ | ✅ | ✅ | ✅ |
| `task:create` | ✅ | ✅ | ✅ | — |
| `task:update` | ✅ | ✅ | ✅ | — |
| `task:delete` | ✅ | ✅ | — | — |
| `task:view` | ✅ | ✅ | ✅ | — |
| `report:view` | ✅ | ✅ | — | ✅ |

### How authorization is enforced

Every protected route handler calls one of these server-side guards before touching the database:

```
requireApiAuth()          → 401 if no valid session
requireApiPermission(key) → 401 if no session, 403 if session lacks the permission
```

The middleware (`proxy.ts`) only checks for the presence of the session cookie as a UX redirect — the real authorization gate is always the in-handler check, never the middleware.

---

## 18. Error Reference

All error responses follow this shape:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|---|---|
| `400` | Bad request — validation failed or business rule violated (e.g. duplicate project code, self-role change) |
| `401` | Unauthenticated — no valid session cookie present |
| `403` | Forbidden — authenticated but lacks the required permission |
| `404` | Resource not found |
| `409` | Conflict — resource already exists (e.g. duplicate email) |
| `500` | Unexpected server error |

### Enum reference

| Field | Allowed values |
|---|---|
| `roleName` | `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `CLIENT` |
| Task `status` | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| Task `priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| Task `type` | `TASK`, `STORY`, `BUG`, `FEATURE` |
| Bug `severity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| Sprint `status` | `PLANNED`, `ACTIVE`, `COMPLETED` |
| Project `status` | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED` |
| Client update `status` | `DRAFT`, `PUBLISHED`, `APPROVED`, `REJECTED` |
| Notification `type` | `TASK_ASSIGNED`, `STATUS_CHANGED`, `COMMENT_ADDED`, `CLIENT_UPDATE`, `SYSTEM` |
| Project member `role` | `MANAGER`, `MEMBER`, `VIEWER` |
| Project file `category` | `SPEC`, `CONTRACT`, `DESIGN`, `DOCUMENT`, `OTHER` |
