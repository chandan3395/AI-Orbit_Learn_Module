import {
  EnrollmentStatus,
  LessonProgressStatus,
  Prisma,
  ResourceType,
} from "@prisma/client";

import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "./learn.constants";
import { LearnApiError } from "./learn.errors";
import type { PaginationMetadata } from "./learn.types";
import {
  countCourseCompletion,
  createBookmark,
  createEnrollment,
  deleteBookmark,
  findContinueLearning,
  findCourseForEnrollmentRemoval,
  findEnrollmentForUpdate,
  findLessonForProgress,
  findLessonProgressForUpdate,
  findPublishedResourceForAction,
  findResourceUserState,
  findUserBookmarks,
  findUserLearning,
  removeEnrollmentInTransaction,
  updateEnrollmentProgress,
  upsertLessonProgress,
  withSerializableTransaction,
} from "./user-learning.repository";
import type {
  MyLearningQuery,
  ProgressUpdateInput,
  RawMyLearningQuery,
} from "./user-learning.types";
import { progressUpdateSchema } from "./request.validation";

const CONTINUE_LEARNING_LIMIT = 6;
const MAX_TRANSACTION_ATTEMPTS = 3;

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
) {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new LearnApiError(
      400,
      "INVALID_QUERY",
      `${name} must be a positive integer`,
    );
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new LearnApiError(400, "INVALID_QUERY", `${name} is too large`);
  }
  return parsed;
}

function pagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  } satisfies PaginationMetadata;
}

export function parseMyLearningQuery(
  raw: RawMyLearningQuery,
): MyLearningQuery {
  const page = parsePositiveInteger(raw.page, DEFAULT_PAGE, "page");
  const limit = parsePositiveInteger(raw.limit, DEFAULT_LIMIT, "limit");
  if (limit > MAX_LIMIT) {
    throw new LearnApiError(
      400,
      "INVALID_QUERY",
      `limit must be less than or equal to ${MAX_LIMIT}`,
    );
  }
  let status: EnrollmentStatus | undefined;
  if (raw.status !== undefined) {
    const normalized = raw.status.toUpperCase();
    if (!Object.values(EnrollmentStatus).includes(normalized as EnrollmentStatus)) {
      throw new LearnApiError(400, "INVALID_QUERY", "Unsupported status value");
    }
    status = normalized as EnrollmentStatus;
  }
  return { status, page, limit };
}

async function requirePublishedResource(slug: string) {
  const resource = await findPublishedResourceForAction(slug);
  if (!resource) {
    throw new LearnApiError(
      404,
      "RESOURCE_NOT_FOUND",
      "Learning resource not found",
    );
  }
  return resource;
}

export async function enrollInResource(userId: string, slug: string) {
  const resource = await requirePublishedResource(slug);
  if (resource.type !== ResourceType.COURSE) {
    throw new LearnApiError(
      400,
      "RESOURCE_NOT_ENROLLABLE",
      "Only published courses can be enrolled in",
    );
  }
  try {
    return await createEnrollment(userId, resource.id);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new LearnApiError(
        409,
        "ALREADY_ENROLLED",
        "User is already enrolled in this course",
      );
    }
    throw error;
  }
}

export async function removeEnrollment(userId: string, slug: string) {
  const resource = await findCourseForEnrollmentRemoval(slug);
  if (!resource) {
    throw new LearnApiError(
      404,
      "RESOURCE_NOT_FOUND",
      "Learning resource not found",
    );
  }
  if (resource.type !== ResourceType.COURSE) {
    throw new LearnApiError(
      400,
      "RESOURCE_NOT_ENROLLABLE",
      "Only courses can have enrollments",
    );
  }
  const removed = await withSerializableTransaction((tx) =>
    removeEnrollmentInTransaction(tx, userId, resource.id),
  );
  return { enrolled: false, removed };
}

export async function addBookmark(userId: string, slug: string) {
  const resource = await requirePublishedResource(slug);
  try {
    const bookmark = await createBookmark(userId, resource.id);
    return { bookmarked: true, ...bookmark };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new LearnApiError(
        409,
        "ALREADY_BOOKMARKED",
        "Resource is already bookmarked",
      );
    }
    throw error;
  }
}

export async function removeBookmark(userId: string, slug: string) {
  const resource = await requirePublishedResource(slug);
  const result = await deleteBookmark(userId, resource.id);
  return { bookmarked: false, removed: result.count > 0 };
}

export function parseProgressUpdate(value: unknown): ProgressUpdateInput {
  return progressUpdateSchema.parse(value);
}

export async function updateLessonProgressForUser(
  userId: string,
  lessonId: string,
  input: ProgressUpdateInput,
) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await withSerializableTransaction(async (tx) => {
        const lesson = await findLessonForProgress(tx, lessonId);
        if (!lesson) {
          throw new LearnApiError(
            404,
            "LESSON_NOT_FOUND",
            "Lesson not found",
          );
        }
        const enrollment = await findEnrollmentForUpdate(
          tx,
          userId,
          lesson.resourceId,
        );
        if (!enrollment) {
          throw new LearnApiError(
            400,
            "NOT_ENROLLED",
            "User is not enrolled in this course",
          );
        }

        const current = await findLessonProgressForUpdate(tx, userId, lesson.id);
        if (
          current?.status === LessonProgressStatus.COMPLETED &&
          input.status !== LessonProgressStatus.COMPLETED
        ) {
          throw new LearnApiError(
            400,
            "INVALID_PROGRESS",
            "Completed lesson progress cannot be reversed",
          );
        }
        if (
          input.positionSeconds !== undefined &&
          lesson.durationMinutes !== null &&
          input.positionSeconds > lesson.durationMinutes * 60
        ) {
          throw new LearnApiError(
            400,
            "INVALID_PROGRESS",
            "positionSeconds exceeds the lesson duration",
          );
        }

        const now = new Date();
        const progress = await upsertLessonProgress(tx, {
          userId,
          lessonId: lesson.id,
          status: input.status,
          positionSeconds:
            input.positionSeconds ?? current?.positionSeconds ?? 0,
          startedAt: current?.startedAt ?? now,
          completedAt:
            input.status === LessonProgressStatus.COMPLETED
              ? (current?.completedAt ?? now)
              : null,
        });
        const { totalLessons, completedLessons } =
          await countCourseCompletion(tx, userId, lesson.resourceId);
        const progressPercentage =
          totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100);
        const completed = totalLessons > 0 && progressPercentage === 100;
        const updatedEnrollment = await updateEnrollmentProgress(tx, {
          enrollmentId: enrollment.id,
          status: completed
            ? EnrollmentStatus.COMPLETED
            : EnrollmentStatus.ACTIVE,
          progressPercentage,
          completedAt: completed ? (enrollment.completedAt ?? now) : null,
          lastAccessedAt: now,
        });
        return { progress, enrollment: updatedEnrollment };
      });
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";
      if (!retryable || attempt === MAX_TRANSACTION_ATTEMPTS) throw error;
    }
  }
  throw new Error("Progress transaction retry limit reached");
}

function toLearningItem(item: Awaited<ReturnType<typeof findUserLearning>>["items"][number]) {
  const { _count, ...resource } = item.resource;
  return {
    resource: { ...resource, lessonCount: _count.lessons },
    progressPercentage: item.progressPercentage,
    status: item.status,
    startedAt: item.startedAt,
    lastAccessedAt: item.lastAccessedAt,
    completedAt: item.completedAt,
  };
}

export async function getMyLearning(
  userId: string,
  raw: RawMyLearningQuery = {},
) {
  const query = parseMyLearningQuery(raw);
  const result = await findUserLearning(userId, query);
  return {
    data: result.items.map(toLearningItem),
    pagination: pagination(query.page, query.limit, result.total),
  };
}

export async function getContinueLearning(userId: string) {
  const items = await findContinueLearning(userId, CONTINUE_LEARNING_LIMIT);
  return items.map((item) => {
    const { _count, lessons, ...resource } = item.resource;
    return {
      resource: { ...resource, lessonCount: _count.lessons },
      progressPercentage: item.progressPercentage,
      lastAccessedAt: item.lastAccessedAt,
      nextIncompleteLesson: lessons[0] ?? null,
    };
  });
}

export async function getMyBookmarks(
  userId: string,
  raw: Pick<RawMyLearningQuery, "page" | "limit"> = {},
) {
  const page = parsePositiveInteger(raw.page, DEFAULT_PAGE, "page");
  const limit = parsePositiveInteger(raw.limit, DEFAULT_LIMIT, "limit");
  if (limit > MAX_LIMIT) {
    throw new LearnApiError(
      400,
      "INVALID_QUERY",
      `limit must be less than or equal to ${MAX_LIMIT}`,
    );
  }
  const result = await findUserBookmarks(userId, page, limit);
  return {
    data: result.items.map(({ resource, ...bookmark }) => {
      const { _count, categories, tags, ...card } = resource;
      return {
        ...bookmark,
        resource: {
          ...card,
          categories: categories.map(({ category }) => category),
          tags: tags.map(({ tag }) => tag),
          lessonCount: _count.lessons,
        },
      };
    }),
    pagination: pagination(page, limit, result.total),
  };
}

export async function getUserState(userId: string, resourceId: string) {
  const state = await findResourceUserState(userId, resourceId);
  const enrollment = state?.enrollments[0];
  return {
    bookmarked: Boolean(state?.bookmarks.length),
    enrolled: Boolean(enrollment),
    progressPercentage: enrollment?.progressPercentage ?? 0,
    enrollmentStatus: enrollment?.status ?? null,
  };
}
