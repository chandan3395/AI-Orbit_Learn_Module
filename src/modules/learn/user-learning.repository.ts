import {
  EnrollmentStatus,
  Prisma,
  ResourceStatus,
  ResourceType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { resourceCardSelect } from "./learn.repository";
import type { MyLearningQuery } from "./user-learning.types";

type DatabaseClient = Prisma.TransactionClient;

export function findPublishedResourceForAction(slug: string) {
  return prisma.learningResource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED },
    select: { id: true, type: true },
  });
}

export function findCourseForEnrollmentRemoval(slug: string) {
  return prisma.learningResource.findUnique({
    where: { slug },
    select: { id: true, type: true },
  });
}

export function createEnrollment(userId: string, resourceId: string) {
  return prisma.enrollment.create({
    data: { userId, resourceId },
    select: {
      id: true,
      status: true,
      progressPercentage: true,
      startedAt: true,
      lastAccessedAt: true,
      completedAt: true,
    },
  });
}

export function createBookmark(userId: string, resourceId: string) {
  return prisma.bookmark.create({
    data: { userId, resourceId },
    select: { id: true, createdAt: true },
  });
}

export function deleteBookmark(userId: string, resourceId: string) {
  return prisma.bookmark.deleteMany({ where: { userId, resourceId } });
}

export function withSerializableTransaction<T>(
  operation: (tx: DatabaseClient) => Promise<T>,
) {
  return prisma.$transaction(operation, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 30_000,
  });
}

export async function removeEnrollmentInTransaction(
  tx: DatabaseClient,
  userId: string,
  resourceId: string,
) {
  const enrollment = await tx.enrollment.findUnique({
    where: { userId_resourceId: { userId, resourceId } },
    select: { id: true },
  });
  if (!enrollment) return false;

  await tx.lessonProgress.deleteMany({
    where: { userId, lesson: { resourceId } },
  });
  await tx.enrollment.delete({ where: { id: enrollment.id } });
  return true;
}

export function findLessonForProgress(tx: DatabaseClient, lessonId: string) {
  return tx.lesson.findFirst({
    where: {
      id: lessonId,
      resource: {
        status: ResourceStatus.PUBLISHED,
        type: ResourceType.COURSE,
      },
    },
    select: { id: true, resourceId: true, durationMinutes: true },
  });
}

export function findEnrollmentForUpdate(
  tx: DatabaseClient,
  userId: string,
  resourceId: string,
) {
  return tx.enrollment.findUnique({
    where: { userId_resourceId: { userId, resourceId } },
    select: { id: true, completedAt: true },
  });
}

export function findLessonProgressForUpdate(
  tx: DatabaseClient,
  userId: string,
  lessonId: string,
) {
  return tx.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: {
      status: true,
      positionSeconds: true,
      startedAt: true,
      completedAt: true,
    },
  });
}

export function upsertLessonProgress(
  tx: DatabaseClient,
  input: {
    userId: string;
    lessonId: string;
    status: "IN_PROGRESS" | "COMPLETED";
    positionSeconds: number;
    startedAt: Date;
    completedAt: Date | null;
  },
) {
  const data = {
    status: input.status,
    positionSeconds: input.positionSeconds,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
  };
  return tx.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: input.userId, lessonId: input.lessonId },
    },
    update: data,
    create: {
      userId: input.userId,
      lessonId: input.lessonId,
      ...data,
    },
    select: {
      lessonId: true,
      status: true,
      positionSeconds: true,
      startedAt: true,
      completedAt: true,
      updatedAt: true,
    },
  });
}

export async function countCourseCompletion(
  tx: DatabaseClient,
  userId: string,
  resourceId: string,
) {
  const [totalLessons, completedLessons] = await Promise.all([
    tx.lesson.count({ where: { resourceId } }),
    tx.lessonProgress.count({
      where: {
        userId,
        status: "COMPLETED",
        lesson: { resourceId },
      },
    }),
  ]);
  return { totalLessons, completedLessons };
}

export function updateEnrollmentProgress(
  tx: DatabaseClient,
  input: {
    enrollmentId: string;
    status: EnrollmentStatus;
    progressPercentage: number;
    completedAt: Date | null;
    lastAccessedAt: Date;
  },
) {
  return tx.enrollment.update({
    where: { id: input.enrollmentId },
    data: {
      status: input.status,
      progressPercentage: input.progressPercentage,
      completedAt: input.completedAt,
      lastAccessedAt: input.lastAccessedAt,
    },
    select: {
      status: true,
      progressPercentage: true,
      lastAccessedAt: true,
      completedAt: true,
    },
  });
}

const learningResourceSelect = {
  id: true,
  title: true,
  slug: true,
  thumbnailUrl: true,
  difficulty: true,
  _count: { select: { lessons: true } },
} satisfies Prisma.LearningResourceSelect;

export async function findUserLearning(
  userId: string,
  query: MyLearningQuery,
) {
  const where: Prisma.EnrollmentWhereInput = {
    userId,
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      select: {
        status: true,
        progressPercentage: true,
        startedAt: true,
        lastAccessedAt: true,
        completedAt: true,
        resource: { select: learningResourceSelect },
      },
      orderBy: [{ lastAccessedAt: "desc" }, { id: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.enrollment.count({ where }),
  ]);
  return { items, total };
}

export function findContinueLearning(userId: string, limit: number) {
  return prisma.enrollment.findMany({
    where: {
      userId,
      status: EnrollmentStatus.ACTIVE,
      resource: {
        status: ResourceStatus.PUBLISHED,
        type: ResourceType.COURSE,
      },
    },
    select: {
      progressPercentage: true,
      lastAccessedAt: true,
      resource: {
        select: {
          ...learningResourceSelect,
          lessons: {
            where: {
              progress: {
                none: { userId, status: "COMPLETED" },
              },
            },
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              durationMinutes: true,
              order: true,
            },
            orderBy: { order: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ lastAccessedAt: "desc" }, { id: "asc" }],
    take: limit,
  });
}

export async function findUserBookmarks(
  userId: string,
  page: number,
  limit: number,
) {
  const where: Prisma.BookmarkWhereInput = {
    userId,
    resource: { status: ResourceStatus.PUBLISHED },
  };
  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        resource: { select: resourceCardSelect },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ]);
  return { items, total };
}

export function findResourceUserState(userId: string, resourceId: string) {
  return prisma.learningResource.findUnique({
    where: { id: resourceId },
    select: {
      bookmarks: {
        where: { userId },
        select: { id: true },
        take: 1,
      },
      enrollments: {
        where: { userId },
        select: { progressPercentage: true, status: true },
        take: 1,
      },
    },
  });
}
