# Backend handoff — Forum UI + API contract (UI-only today)

This app currently implements a **UI-only** forum using an in-browser store (`localStorage`) so the UX can be developed before backend work.

The backend should replace the UI store with real APIs while preserving the same behaviors and states described below.

## What backend should build

- **Auth**: register/login/me
- **Threads (Questions)**: list + detail + create (creates `pending`)
- **Thread moderation**: admin list + approve/reject (controls visibility)
- **User management (admin)**: list users + promote/demote admin + ban/unban
- **Replies (Answers)**: list + create (publishes immediately)
- **Image attachments**: images-only upload + list on thread detail

## Core product rules

- **Users can register/login** (currently UI only).
- **Users can create a new question/topic**.
- **New questions require admin approval** before appearing in the public forum.
- **Answers/replies do not require approval** and appear immediately.
- **Questions can include image attachments only** (any image format). (UI currently supports selecting images and previewing them.)
- **Multi-language UI**: Persian (default) + English. UI toggles **RTL/LTR** and persists language in localStorage.

## Routes & pages (current UI)

- **`/login`**: Login UI form
  - Fields: email, password
  - Behavior: success toast + navigate to `/` (demo)

- **`/register`**: Register UI form
  - Fields: name, email, password, confirmPassword
  - Behavior: success toast + navigate to `/login` (demo)

- **`/new`**: Create new question/topic
  - Fields:
    - title (required)
    - category (required)
    - tags (comma-separated)
    - content/body (required)
    - **images** (multiple images allowed; UI enforces `image/*`)
  - Behavior:
    - On submit: creates a **pending** thread
    - Shows a “در انتظار تأیید” success state (approval required)

- **`/threads`**: Public threads list
  - Shows only **approved** threads
  - Includes filtering UI (category chips + filter buttons)
  - Has skeleton/animation states (purely visual)

- **`/threads/:id`**: Thread detail + replies
  - Only accessible for **approved** threads
  - Displays thread info, **full thread content** (`content`), excerpt, and **attached images list** (UI metadata)
  - Replies list
  - “Your reply” composer:
    - On submit: reply is appended immediately (no approval), reply count increments

- **`/admin`**: Admin moderation UI (approval queue)
  - UI has **two tabs**:
    - **Threads**: moderation queue (`pending | approved | rejected`)
    - **Users**: user management (role/status)
  - Shows all threads with status: `pending | approved | rejected`
  - Admin actions:
    - Approve → becomes publicly visible in `/threads`
    - Reject → stays hidden from `/threads`
  - Users actions (UI-only today):
    - Promote/demote: `user ↔ admin`
    - Ban/unban: `active ↔ banned`

## Data model (backend target)

> Tip: keep the response shapes stable and add new fields over time; UI relies on these fields to render the forum.

### Thread (Question/Topic)

Minimum fields the backend should support:

- **id**: string
- **title**: string
- **content**: string (full body)
- **excerpt**: string (can be computed server-side)
- **category**: string (or categoryId)
- **tags**: string[]
- **author**:
  - id
  - displayName
  - avatarUrl (optional)
- **status**: `pending | approved | rejected`
- **counts**:
  - repliesCount
  - viewsCount
  - likesCount
- **timestamps**:
  - createdAt
  - updatedAt
  - approvedAt (nullable)
  - rejectedAt (nullable)

Optional but recommended:

- **slug**: string (URL friendly)
- **lastActivityAt**: timestamp (for sorting)
- **attachments**: image attachment list (or returned separately)
- **language**: `fa|en` (optional; if you want to store thread language for search/ranking)

### Thread images (attachments)

UI currently allows selecting **multiple images** (any image format).

Backend suggestion:

- Attachments:
  - id
  - threadId
  - uploaderUserId
  - originalFileName
  - mimeType (e.g. `image/png`, `image/webp`, `image/svg+xml`, ...)
  - sizeBytes
  - storageKey / url
  - createdAt

Rules:

- Only allow **image MIME types**.
- Max count/size limits can be decided later; UI does not enforce size limits yet.

UI expectation today:

- During question creation UI sends only **metadata** to local storage.
- Backend should support *real* upload and return a URL to render (preview) on detail page.

### Reply (Answer)

- **id**: string
- **threadId**: string
- **author**: user info
- **content**: string
- **createdAt**: timestamp
- **likesCount**: number
- **status**: (not needed; replies publish immediately)

### User

Minimum fields the backend should support:

- **id**: string
- **name**: string
- **email**: string
- **role**: `user | admin`
- **status**: `active | banned`
- **joinedAt**: timestamp

Optional but recommended:

- **avatarUrl**: string | null
- **lastSeenAt**: timestamp | null
- **threadsCount**: number
- **repliesCount**: number

## API contract (recommended)

### Conventions

- **Base URL**: `/api`
- **Auth**: `Authorization: Bearer <token>`
- **JSON**: all non-upload endpoints use `application/json`
- **Language** (recommended):
  - request header: `Accept-Language: fa|en`
  - optional response header: `Content-Language`
- **Pagination** (list endpoints):
  - query: `cursor` + `limit` (or `page` + `pageSize`)
  - response: `items` + `nextCursor`
- **Errors**:
  - 400 validation
  - 401 unauthenticated
  - 403 unauthorized
  - 404 not found
  - 409 conflict

### Auth

#### `POST /api/auth/register`

Request:

```json
{ "name": "آرش رضایی", "email": "you@example.com", "password": "******" }
```

Response:

```json
{ "token": "jwt_or_session_token", "user": { "id": "u1", "name": "آرش رضایی", "email": "you@example.com" } }
```

#### `POST /api/auth/login`

Request:

```json
{ "email": "you@example.com", "password": "******" }
```

Response: same shape as register.

#### `GET /api/me`

Response:

```json
{ "id": "u1", "name": "آرش رضایی", "email": "you@example.com", "role": "user" }
```

### Threads (public)

#### `GET /api/threads`

Returns only **approved** threads.

Query (suggested):

- `category` (string)
- `sort` (`new|hot|top`)
- `q` (search query)
- `lang` (`fa|en`) (optional)
- `cursor`, `limit`

Response:

```json
{
  "items": [
    {
      "id": "t1",
      "title": "عنوان",
      "excerpt": "خلاصه...",
      "category": "عیب‌یابی سخت‌افزار",
      "tags": ["GPU"],
      "author": { "id": "u1", "displayName": "آرش رضایی", "avatarUrl": null },
      "status": "approved",
      "counts": { "repliesCount": 2, "viewsCount": 120, "likesCount": 5 },
      "createdAt": "2026-05-06T10:00:00Z",
      "lastActivityAt": "2026-05-06T11:00:00Z"
    }
  ],
  "nextCursor": null
}
```

#### `GET /api/threads/:id`

Returns **approved** thread detail (public).

Response:

```json
{
  "id": "t1",
  "title": "عنوان",
  "content": "متن کامل...",
  "excerpt": "خلاصه...",
  "category": "عیب‌یابی سخت‌افزار",
  "tags": ["GPU"],
  "author": { "id": "u1", "displayName": "آرش رضایی", "avatarUrl": null },
  "status": "approved",
  "counts": { "repliesCount": 2, "viewsCount": 120, "likesCount": 5 },
  "createdAt": "2026-05-06T10:00:00Z",
  "updatedAt": "2026-05-06T10:00:00Z",
  "attachments": [
    { "id": "a1", "url": "https://cdn.example.com/a1.webp", "mimeType": "image/webp", "sizeBytes": 12345 }
  ]
}
```

### Threads (create)

#### `POST /api/threads`

Creates a **pending** thread.

Request:

```json
{ "title": "عنوان", "content": "متن کامل...", "category": "مونتاژ کیس", "tags": ["RAM"], "language": "fa" }
```

Response:

```json
{ "id": "t_new", "status": "pending" }
```

### Images (attachments)

#### `POST /api/threads/:id/images`

- Auth required
- Only allow `image/*`
- `multipart/form-data`

Response:

```json
{
  "attachments": [
    { "id": "a1", "url": "https://cdn.example.com/a1.png", "mimeType": "image/png", "sizeBytes": 12345 }
  ]
}
```

### Replies

#### `GET /api/threads/:id/replies`

Response:

```json
{
  "items": [
    {
      "id": "r1",
      "threadId": "t1",
      "author": { "id": "u2", "displayName": "حسین مرادی", "avatarUrl": null },
      "content": "پاسخ...",
      "createdAt": "2026-05-06T11:00:00Z",
      "likesCount": 0
    }
  ],
  "nextCursor": null
}
```

#### `POST /api/threads/:id/replies`

Publishes immediately (no approval).

Request:

```json
{ "content": "پاسخ..." }
```

Response:

```json
{ "id": "r_new" }
```

### Admin moderation

> Only admin role should access these endpoints.

#### `GET /api/admin/threads`

Query:

- `status=pending|approved|rejected|all`

Response: same `Thread` item shape as list, but includes pending/rejected too.

#### `POST /api/admin/threads/:id/approve`

Response:

```json
{ "id": "t1", "status": "approved" }
```

#### `POST /api/admin/threads/:id/reject`

Response:

```json
{ "id": "t1", "status": "rejected" }
```

### Admin user management

> Only admin role should access these endpoints.

#### `GET /api/admin/users`

Query (suggested):

- `q` (search by name/email)
- `role` (`user|admin`)
- `status` (`active|banned`)
- `cursor`, `limit`

Response:

```json
{
  "items": [
    {
      "id": "u1",
      "name": "Sara Mohammadi",
      "email": "sara@example.com",
      "role": "user",
      "status": "active",
      "joinedAt": "2026-04-12T00:00:00Z"
    }
  ],
  "nextCursor": null
}
```

#### `POST /api/admin/users/:id/role`

Request:

```json
{ "role": "admin" }
```

Response:

```json
{ "id": "u1", "role": "admin" }
```

#### `POST /api/admin/users/:id/ban`

Request:

```json
{ "status": "banned" }
```

Response:

```json
{ "id": "u1", "status": "banned" }
```

## UI store implementation notes (current code)

Current UI state is implemented in:

- `src/lib/forum-store.ts`
- `src/lib/i18n.tsx` (language toggle; Persian is default)

Key behaviors:

- Creating a question stores it as `status: "pending"` (and stores **image metadata only**, not binary)
- Public list `/threads` filters to `status === "approved"`
- Admin page updates status to approved/rejected
- Replies append immediately and increment reply count
- Thread detail page reads replies from `repliesByThreadId[threadId]` and re-renders immediately after posting
- Admin includes a **Users** tab powered by `users[]` in the store:
  - `setUserRole(userId, role)` (promote/demote)
  - `toggleUserBan(userId)` (ban/unban)

Implementation detail (important for backend wiring later):

- UI now reads **the full state** via `useForumState()` and computes filtered lists with `useMemo`.
  - When integrating backend, replace those memos with query hooks (React Query) that call the endpoints above.

