import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { ResourceStatus } from "@prisma/client";

import { mapApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/modules/auth/demo-user";

import {
  adminCreateAuthor,
  adminCreateCategory,
  adminCreateLesson,
  adminCreateResource,
  adminCreateTag,
  adminDeleteResource,
  adminReorderLessons,
  adminUpdateAuthor,
  adminUpdateCategory,
  adminUpdateResource,
  adminUpdateTag,
} from "./admin.service";
import {
  authorCreateSchema,
  categoryCreateSchema,
  lessonCreateSchema,
  resourceCreateSchema,
  tagCreateSchema,
} from "./admin.validation";
import { LearnApiError } from "./learn.errors";
import { enrollInResource, removeEnrollment } from "./user-learning.service";

const adminId = "10000000-0000-4000-8000-000000000003";
const normalUserId = "10000000-0000-4000-8000-000000000001";
const prefix = "phase6-test";

let author: { id: string };
let categories: Array<{ id: string }>;
let tags: Array<{ id: string }>;
let resource: { id: string; slug: string };

async function cleanup() {
  const testResources = await prisma.learningResource.findMany({ where: { slug: { startsWith: prefix } }, select: { id: true, lessons: { select: { id: true } } } });
  const resourceIds = testResources.map(({ id }) => id);
  const lessonIds = testResources.flatMap((item) => item.lessons.map(({ id }) => id));
  await prisma.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await prisma.enrollment.deleteMany({ where: { resourceId: { in: resourceIds } } });
  await prisma.bookmark.deleteMany({ where: { resourceId: { in: resourceIds } } });
  await prisma.lesson.deleteMany({ where: { resourceId: { in: resourceIds } } });
  await prisma.learningResource.deleteMany({ where: { id: { in: resourceIds } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: prefix } } });
  await prisma.tag.deleteMany({ where: { slug: { startsWith: prefix } } });
  await prisma.author.deleteMany({ where: { slug: { startsWith: prefix } } });
}

describe("admin content management", { concurrency: 1 }, () => {
  before(cleanup);
  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test("admin authorization returns 401 and 403 appropriately", async () => {
    await assert.rejects(() => requireAdmin(new Request("http://localhost")), (error) => error instanceof LearnApiError && error.status === 401);
    await assert.rejects(
      () => requireAdmin(new Request("http://localhost", { headers: { "x-demo-user-id": normalUserId } })),
      (error) => error instanceof LearnApiError && error.status === 403 && error.code === "FORBIDDEN",
    );
    const admin = await requireAdmin(new Request("http://localhost", { headers: { "x-demo-user-id": adminId } }));
    assert.equal(admin.role, "ADMIN");
  });

  test("category, tag, and author management creates and updates records", async () => {
    author = await adminCreateAuthor(authorCreateSchema.parse({ name: "Phase Six Author", slug: `${prefix}-author`, bio: "Temporary author used by isolated backend tests." }));
    categories = [
      await adminCreateCategory(categoryCreateSchema.parse({ name: "Phase Six Category A", slug: `${prefix}-category-a` })),
      await adminCreateCategory(categoryCreateSchema.parse({ name: "Phase Six Category B", slug: `${prefix}-category-b` })),
    ];
    tags = [
      await adminCreateTag(tagCreateSchema.parse({ name: "Phase Six Tag A", slug: `${prefix}-tag-a` })),
      await adminCreateTag(tagCreateSchema.parse({ name: "Phase Six Tag B", slug: `${prefix}-tag-b` })),
    ];
    assert.equal((await adminUpdateAuthor({ id: author.id, bio: "Updated isolated test author biography." })).bio, "Updated isolated test author biography.");
    assert.equal((await adminUpdateCategory({ id: categories[0].id, description: "Updated test category." })).description, "Updated test category.");
    assert.equal((await adminUpdateTag({ id: tags[0].id, name: "Phase Six Updated Tag" })).name, "Phase Six Updated Tag");
  });

  test("resource creation validates references and duplicate slugs", async () => {
    const input = resourceCreateSchema.parse({
      title: "Phase Six Reliability Course", slug: `${prefix}-reliability-course`, shortDescription: "A realistic temporary course for backend reliability tests.",
      description: "This temporary course validates resource transactions, relationships, lessons, and safe deletion behavior.",
      type: "COURSE", difficulty: "INTERMEDIATE", status: "PUBLISHED", durationMinutes: 45, isFeatured: false,
      authorId: author.id, categoryIds: [categories[0].id], tagIds: [tags[0].id], publishedAt: "2026-09-05T12:00:00.000Z",
    });
    resource = await adminCreateResource(input);
    assert.equal(resource.slug, `${prefix}-reliability-course`);
    await assert.rejects(() => adminCreateResource(input), (error) => mapApiError(error).code === "UNIQUE_CONSTRAINT");
    await assert.rejects(
      () => adminCreateResource({ ...input, slug: `${prefix}-bad-reference`, authorId: "10000000-0000-4000-8000-999999999999" }),
      (error) => error instanceof LearnApiError && error.code === "INVALID_REFERENCE",
    );
  });

  test("resource updates replace category and tag relationships atomically", async () => {
    const updated = await adminUpdateResource(resource.id, { title: "Phase Six Updated Reliability Course", categoryIds: [categories[1].id], tagIds: [tags[1].id] });
    assert.equal(updated.categories[0].categoryId, categories[1].id);
    assert.equal(updated.tags[0].tagId, tags[1].id);
  });

  test("lesson validation and unique order constraints are enforced", async () => {
    assert.throws(() => lessonCreateSchema.parse({ title: "Invalid Video", slug: "invalid-video", type: "VIDEO", order: 1 }));
    await adminCreateLesson(resource.id, lessonCreateSchema.parse({ title: "Foundation and Context", slug: "foundation-and-context", type: "TEXT", content: "Detailed test lesson content.", durationMinutes: 10, order: 1 }));
    await adminCreateLesson(resource.id, lessonCreateSchema.parse({ title: "Applied Demonstration", slug: "applied-demonstration", type: "VIDEO", videoUrl: "https://example.com/video/demo", durationMinutes: 12, order: 2 }));
    await assert.rejects(
      () => adminCreateLesson(resource.id, lessonCreateSchema.parse({ title: "Duplicate Order", slug: "duplicate-order", type: "TEXT", content: "Duplicate order test content.", order: 2 })),
      (error) => mapApiError(error).code === "UNIQUE_CONSTRAINT",
    );
  });

  test("lesson reordering accounts for every lesson without collisions", async () => {
    const lessons = await prisma.lesson.findMany({ where: { resourceId: resource.id }, orderBy: { order: "asc" } });
    const reordered = await adminReorderLessons(resource.id, lessons.map(({ id }) => id).reverse());
    assert.deepEqual(reordered.map(({ order }) => order), [1, 2]);
    assert.equal(reordered[0].id, lessons[1].id);
  });

  test("resource deletion archives history and hard-deletes when safe", async () => {
    await enrollInResource(adminId, resource.slug);
    const archived = await adminDeleteResource(resource.id);
    assert.equal(archived.action, "ARCHIVED");
    assert.equal((await prisma.learningResource.findUniqueOrThrow({ where: { id: resource.id } })).status, ResourceStatus.ARCHIVED);
    await removeEnrollment(adminId, resource.slug);
    const deleted = await adminDeleteResource(resource.id);
    assert.equal(deleted.action, "DELETED");
    assert.equal(await prisma.learningResource.findUnique({ where: { id: resource.id } }), null);
  });

  test("Prisma errors map to safe application errors", () => {
    const validationResult = resourceCreateSchema.safeParse({});
    assert.equal(validationResult.success, false);
    if (!validationResult.success) {
      const validationError = mapApiError(validationResult.error);
      assert.equal(validationError.status, 400);
      assert.equal(validationError.code, "VALIDATION_ERROR");
    }
    const safe = mapApiError(new Error("database internals"));
    assert.equal(safe.status, 500);
    assert.equal(safe.code, "INTERNAL_SERVER_ERROR");
    assert.equal(safe.message.includes("database internals"), false);
  });
});
