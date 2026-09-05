import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { EnrollmentStatus, LessonProgressStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { resolveDemoUser } from "@/modules/auth/demo-user";

import { LearnApiError } from "./learn.errors";
import { getPublicResource } from "./learn.service";
import {
  addBookmark,
  enrollInResource,
  getContinueLearning,
  getMyBookmarks,
  getMyLearning,
  removeBookmark,
  removeEnrollment,
  updateLessonProgressForUser,
} from "./user-learning.service";

const adminId = "10000000-0000-4000-8000-000000000003";
const activeSlug = "multi-agent-systems-in-practice";
const completedSlug = "ai-assisted-typescript-development";
const secondActiveSlug = "building-reliable-llm-applications";
const unenrolledSlug = "ai-for-data-analysis";
const guideSlug = "choosing-the-right-llm";
const nonCourseSlug = "claude-for-long-form-analysis";
const testSlugs = [
  activeSlug,
  completedSlug,
  secondActiveSlug,
  unenrolledSlug,
  guideSlug,
  nonCourseSlug,
];

let resources: Awaited<ReturnType<typeof loadTestResources>>;
let otherUserEnrollmentCount = 0;

async function loadTestResources() {
  return prisma.learningResource.findMany({
    where: { slug: { in: testSlugs } },
    select: {
      id: true,
      slug: true,
      lessons: { select: { id: true, order: true }, orderBy: { order: "asc" } },
    },
  });
}

function resource(slug: string) {
  const value = resources.find((item) => item.slug === slug);
  assert.ok(value, `Missing seeded resource: ${slug}`);
  return value;
}

async function cleanupTestData() {
  const resourceIds = resources.map((item) => item.id);
  const lessonIds = resources.flatMap((item) => item.lessons.map(({ id }) => id));
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({
      where: { userId: adminId, lessonId: { in: lessonIds } },
    }),
    prisma.enrollment.deleteMany({
      where: { userId: adminId, resourceId: { in: resourceIds } },
    }),
    prisma.bookmark.deleteMany({
      where: { userId: adminId, resourceId: { in: resourceIds } },
    }),
  ]);
}

describe("authenticated user-learning services", { concurrency: 1 }, () => {
  before(async () => {
    resources = await loadTestResources();
    assert.equal(resources.length, testSlugs.length);
    await cleanupTestData();
    otherUserEnrollmentCount = await prisma.enrollment.count({
      where: { userId: "10000000-0000-4000-8000-000000000001" },
    });
  });

  after(async () => {
    await cleanupTestData();
    assert.equal(
      await prisma.enrollment.count({
        where: { userId: "10000000-0000-4000-8000-000000000001" },
      }),
      otherUserEnrollmentCount,
    );
    await prisma.$disconnect();
  });

  test("missing and invalid demo users are rejected", async () => {
    await assert.rejects(
      () => resolveDemoUser(new Request("http://localhost")),
      (error) => error instanceof LearnApiError && error.status === 401,
    );
    await assert.rejects(
      () =>
        resolveDemoUser(
          new Request("http://localhost", {
            headers: { "x-demo-user-id": "not-a-uuid" },
          }),
        ),
      (error) => error instanceof LearnApiError && error.code === "UNAUTHORIZED",
    );
    await assert.rejects(() =>
      resolveDemoUser(
        new Request("http://localhost", {
          headers: {
            "x-demo-user-id": "10000000-0000-4000-8000-999999999999",
          },
        }),
      ),
    );
  });

  test("course enrollment succeeds and duplicate enrollment is rejected", async () => {
    const enrollment = await enrollInResource(adminId, activeSlug);
    assert.equal(enrollment.status, EnrollmentStatus.ACTIVE);
    assert.equal(enrollment.progressPercentage, 0);
    await assert.rejects(
      () => enrollInResource(adminId, activeSlug),
      (error) => error instanceof LearnApiError && error.code === "ALREADY_ENROLLED",
    );
  });

  test("guide enrollment is rejected", async () => {
    await assert.rejects(
      () => enrollInResource(adminId, nonCourseSlug),
      (error) =>
        error instanceof LearnApiError &&
        error.code === "RESOURCE_NOT_ENROLLABLE",
    );
  });

  test("bookmark creation, duplicate protection, and removal work", async () => {
    const created = await addBookmark(adminId, guideSlug);
    assert.equal(created.bookmarked, true);
    await assert.rejects(
      () => addBookmark(adminId, guideSlug),
      (error) => error instanceof LearnApiError && error.code === "ALREADY_BOOKMARKED",
    );
    assert.equal((await removeBookmark(adminId, guideSlug)).removed, true);
    assert.equal((await removeBookmark(adminId, guideSlug)).removed, false);
    await addBookmark(adminId, guideSlug);
  });

  test("progress without enrollment is rejected", async () => {
    const lesson = resource(unenrolledSlug).lessons[0];
    await assert.rejects(
      () =>
        updateLessonProgressForUser(adminId, lesson.id, {
          status: LessonProgressStatus.IN_PROGRESS,
          positionSeconds: 30,
        }),
      (error) => error instanceof LearnApiError && error.code === "NOT_ENROLLED",
    );
  });

  test("progress updates recalculate enrollment percentage", async () => {
    const lesson = resource(activeSlug).lessons[0];
    const started = await updateLessonProgressForUser(adminId, lesson.id, {
      status: LessonProgressStatus.IN_PROGRESS,
      positionSeconds: 60,
    });
    assert.equal(started.enrollment.progressPercentage, 0);
    assert.ok(started.progress.startedAt);

    const completed = await updateLessonProgressForUser(adminId, lesson.id, {
      status: LessonProgressStatus.COMPLETED,
    });
    assert.equal(completed.enrollment.progressPercentage, 20);
    assert.equal(completed.enrollment.status, EnrollmentStatus.ACTIVE);
    assert.ok(completed.progress.completedAt);
  });

  test("completing every lesson completes the course", async () => {
    await enrollInResource(adminId, completedSlug);
    let result: Awaited<ReturnType<typeof updateLessonProgressForUser>> | undefined;
    for (const lesson of resource(completedSlug).lessons) {
      result = await updateLessonProgressForUser(adminId, lesson.id, {
        status: LessonProgressStatus.COMPLETED,
      });
    }
    assert.equal(result?.enrollment.progressPercentage, 100);
    assert.equal(result?.enrollment.status, EnrollmentStatus.COMPLETED);
    assert.ok(result?.enrollment.completedAt);
  });

  test("Continue Learning is ordered by latest access", async () => {
    await enrollInResource(adminId, secondActiveSlug);
    const items = await getContinueLearning(adminId);
    assert.equal(items[0]?.resource.slug, secondActiveSlug);
    assert.ok(
      items.every(
        (item, index) =>
          index === 0 ||
          items[index - 1].lastAccessedAt >= item.lastAccessedAt,
      ),
    );
    assert.ok(items.every((item) => item.nextIncompleteLesson));
  });

  test("My Learning filters active and completed enrollments", async () => {
    const active = await getMyLearning(adminId, { status: "ACTIVE" });
    const completed = await getMyLearning(adminId, { status: "COMPLETED" });
    assert.ok(active.data.length >= 2);
    assert.ok(active.data.every((item) => item.status === EnrollmentStatus.ACTIVE));
    assert.equal(completed.data.length, 1);
    assert.equal(completed.data[0].resource.slug, completedSlug);
  });

  test("bookmark listing is paginated and newest first", async () => {
    await addBookmark(adminId, activeSlug);
    const result = await getMyBookmarks(adminId, { page: "1", limit: "10" });
    assert.equal(result.pagination.total, 2);
    assert.ok(
      result.data[0].createdAt >= result.data[1].createdAt,
    );
  });

  test("resource detail optionally includes user state", async () => {
    const publicDetail = await getPublicResource(activeSlug);
    assert.equal("userState" in publicDetail, false);
    const authenticatedDetail = await getPublicResource(activeSlug, adminId);
    if (!("userState" in authenticatedDetail)) {
      assert.fail("Authenticated detail must include userState");
    }
    assert.deepEqual(authenticatedDetail.userState, {
      bookmarked: true,
      enrolled: true,
      progressPercentage: 20,
      enrollmentStatus: EnrollmentStatus.ACTIVE,
    });
  });

  test("enrollment removal deletes only that user's course progress", async () => {
    const result = await removeEnrollment(adminId, activeSlug);
    assert.equal(result.removed, true);
    assert.equal((await removeEnrollment(adminId, activeSlug)).removed, false);
    assert.equal(
      await prisma.lessonProgress.count({
        where: {
          userId: adminId,
          lesson: { resourceId: resource(activeSlug).id },
        },
      }),
      0,
    );
  });
});
