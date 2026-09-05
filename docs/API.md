# Learn API reference

All endpoints use the Node.js runtime and return JSON. Success responses use `{ "success": true, "data": ... }`; paginated responses additionally include `pagination`. Errors use:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "..." },
  "requestId": "uuid"
}
```

The same request ID is returned in the `x-request-id` response header. Internal database details and stack traces are never returned.

## Authentication

Public endpoints need no authentication. User and admin endpoints currently require `x-demo-user-id: <seeded-user-uuid>`. Admin endpoints additionally require that user to have role `ADMIN`. Missing or invalid identity returns `401 UNAUTHORIZED`; a non-admin identity on an admin route returns `403 FORBIDDEN`.

`x-demo-user-id` is development/demo authentication by design. It is centralized in `src/modules/auth/demo-user.ts` so a trusted session implementation can replace it later.

## Public endpoints

### List resources

`GET /api/learn/resources` — public

Query parameters:

| Parameter | Values / rules |
| --- | --- |
| `search` | Optional text, maximum 200 characters; searches title and descriptions |
| `type` | `COURSE`, `GUIDE`, or `EBOOK` |
| `difficulty` | `BEGINNER`, `INTERMEDIATE`, or `ADVANCED` |
| `category` | Lowercase category slug |
| `tag` | Lowercase tag slug |
| `featured` | `true` or `false` |
| `sort` | `newest` (default), `oldest`, `title-asc`, or `title-desc` |
| `page` | Positive integer; default `1` |
| `limit` | Positive integer; default `12`, maximum `50` |

Returns only `PUBLISHED` resources. Each card includes author, categories, tags, and `lessonCount` plus pagination metadata. Invalid query values return `400 INVALID_QUERY`.

```json
{
  "success": true,
  "data": [{
    "id": "uuid",
    "title": "Build Your First AI Agent",
    "slug": "build-your-first-ai-agent",
    "shortDescription": "Create a tool-using agent...",
    "thumbnailUrl": "https://example.com/...",
    "type": "COURSE",
    "difficulty": "INTERMEDIATE",
    "durationMinutes": 110,
    "isFeatured": true,
    "publishedAt": "2026-06-12T12:00:00.000Z",
    "author": { "id": "uuid", "name": "Marcus Chen", "slug": "marcus-chen", "avatarUrl": "https://example.com/..." },
    "categories": [{ "id": "uuid", "name": "AI Agents", "slug": "ai-agents" }],
    "tags": [{ "id": "uuid", "name": "Agents", "slug": "agents" }],
    "lessonCount": 5
  }],
  "pagination": { "page": 1, "limit": 12, "total": 23, "totalPages": 2, "hasNextPage": true, "hasPreviousPage": false }
}
```

### Resource detail

`GET /api/learn/resources/{slug}` — public; optional demo authentication

Returns a published resource with author, categories, tags, and lessons ordered by `order`. When a valid `x-demo-user-id` is supplied, `data.userState` also includes bookmark, enrollment, percentage, enrollment status, and per-lesson progress. Unknown, draft, or archived resources return `404 RESOURCE_NOT_FOUND`.

### Categories

`GET /api/learn/categories` — public

Returns alphabetized categories with `resourceCount`, counting published resources only.

### Related resources

`GET /api/learn/resources/{slug}/related` — public

Returns up to four other published resources, ranked deterministically by shared categories, shared tags, resource type, publication date, and title. The current resource is excluded. Unknown or non-public slugs return `404 RESOURCE_NOT_FOUND`.

## User endpoints

All endpoints in this section require `x-demo-user-id`.

### Enroll

`POST /api/learn/resources/{slug}/enroll`

No request body. Creates an active enrollment for a published course and returns the enrollment state with `201`. Important errors: `400 RESOURCE_NOT_ENROLLABLE`, `404 RESOURCE_NOT_FOUND`, `409 ALREADY_ENROLLED`.

### Remove enrollment

`DELETE /api/learn/resources/{slug}/enrollment`

No request body. Atomically deletes only the current user’s enrollment and lesson progress for that course.

```json
{ "success": true, "data": { "enrolled": false, "removed": true } }
```

### Add or remove bookmark

- `POST /api/learn/resources/{slug}/bookmark` — creates a bookmark and returns `201`.
- `DELETE /api/learn/resources/{slug}/bookmark` — removes only the current user’s bookmark.

No request body. Important errors: `404 RESOURCE_NOT_FOUND`, `409 ALREADY_BOOKMARKED`.

### Update lesson progress

`PATCH /api/learn/lessons/{lessonId}/progress`

```json
{ "status": "IN_PROGRESS", "positionSeconds": 120 }
```

`status` must be `IN_PROGRESS` or `COMPLETED`; `positionSeconds` is an optional nonnegative integer and cannot exceed a known lesson duration. The user must be enrolled. The response contains the persisted lesson progress and authoritative enrollment percentage/status. Important errors: `400 VALIDATION_ERROR`, `400 INVALID_PROGRESS`, `400 NOT_ENROLLED`, `404 LESSON_NOT_FOUND`.

### My Learning

`GET /api/learn/me/learning`

Query: optional `status=ACTIVE|COMPLETED`, plus `page` and `limit` using the listing pagination rules. Returns the current user’s enrollments ordered by latest access.

### Continue Learning

`GET /api/learn/me/continue-learning`

Returns up to six active, published courses ordered by latest access, including the next incomplete lesson. No query parameters.

### My bookmarks

`GET /api/learn/me/bookmarks`

Query: optional `page` and `limit` using the listing pagination rules. Returns current-user bookmarks for published resources, newest first.

## Admin endpoints

Every admin endpoint requires `x-demo-user-id` for a user with role `ADMIN`. JSON bodies are strict: unknown fields are rejected. Requests larger than 64 KiB return `413 PAYLOAD_TOO_LARGE`.

### Resource management

- `POST /api/learn/admin/resources` — create; returns `201`.
- `PATCH /api/learn/admin/resources/{resourceId}` — update one or more fields.
- `DELETE /api/learn/admin/resources/{resourceId}` — archives a resource with learning history, otherwise safely deletes it.

Create body (update accepts a nonempty subset):

```json
{
  "title": "Reliable Agent Systems",
  "slug": "reliable-agent-systems",
  "shortDescription": "A practical course description.",
  "description": "A complete description long enough for a detail page.",
  "thumbnailUrl": "https://example.com/image.jpg",
  "type": "COURSE",
  "difficulty": "INTERMEDIATE",
  "status": "PUBLISHED",
  "durationMinutes": 90,
  "sourceUrl": null,
  "isFeatured": false,
  "authorId": "uuid",
  "categoryIds": ["uuid"],
  "tagIds": ["uuid"],
  "publishedAt": "2026-09-05T12:00:00.000Z"
}
```

URLs must be valid, durations positive, IDs valid and unique, slugs lowercase/URL-safe, and published resources require `publishedAt`. Author/category/tag references must exist. Resource and relationship writes are transactional. Important errors: `400 VALIDATION_ERROR`, `400 INVALID_REFERENCE`, `404 RECORD_NOT_FOUND`, `409 UNIQUE_CONSTRAINT`, `409 TRANSACTION_CONFLICT`.

Deletion returns `{ "id": "uuid", "action": "ARCHIVED" }` or `"DELETED"`.

### Lesson management

- `POST /api/learn/admin/resources/{resourceId}/lessons` — create; returns `201`.
- `PATCH /api/learn/admin/lessons/{lessonId}` — update.
- `DELETE /api/learn/admin/lessons/{lessonId}` — delete only when no progress history exists.

Create body (update accepts a nonempty subset):

```json
{
  "title": "Planning Reliable Tool Calls",
  "slug": "planning-reliable-tool-calls",
  "description": "Optional summary",
  "type": "TEXT",
  "content": "Lesson content",
  "durationMinutes": 15,
  "order": 1,
  "isPreview": false
}
```

Lessons belong only to courses. `order` and duration are positive. A `TEXT` lesson needs `content`, `VIDEO` needs `videoUrl`, and `LINK` needs `externalUrl`. Slug and order are unique within a resource. Important errors: `400 INVALID_LESSON_RESOURCE`, `404 RECORD_NOT_FOUND`, `409 LESSON_HAS_HISTORY`, `409 UNIQUE_CONSTRAINT`.

### Reorder lessons

`PATCH /api/learn/admin/resources/{resourceId}/lessons/reorder`

```json
{ "lessonIds": ["uuid-1", "uuid-2", "uuid-3"] }
```

The unique list must contain every lesson in the course exactly once (maximum 100). Reordering is transactional and uses collision-free temporary positions.

### Category management

- `POST /api/learn/admin/categories` with `{ "name": "AI Agents", "slug": "ai-agents", "description": "..." }`; returns `201`.
- `PATCH /api/learn/admin/categories` with `id` plus a nonempty subset of those fields.

### Tag management

- `POST /api/learn/admin/tags` with `{ "name": "Agents", "slug": "agents" }`; returns `201`.
- `PATCH /api/learn/admin/tags` with `id` plus a nonempty subset of those fields.

### Author management

- `POST /api/learn/admin/authors` with `{ "name": "Ada Example", "slug": "ada-example", "bio": "...", "avatarUrl": "https://example.com/avatar.png" }`; returns `201`.
- `PATCH /api/learn/admin/authors` with `id` plus a nonempty subset of those fields.

Taxonomy/author slugs are unique. Update IDs must be UUIDs. These endpoints intentionally omit deletion so referenced content cannot be orphaned. Common errors are `400 VALIDATION_ERROR`, `404 RECORD_NOT_FOUND`, and `409 UNIQUE_CONSTRAINT`.

