import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { LessonCreateInput, LessonUpdateInput, ResourceCreateInput, ResourceUpdateInput } from "./admin.validation";

export type AdminTx = Prisma.TransactionClient;

export function adminTransaction<T>(operation: (tx: AdminTx) => Promise<T>) {
  return prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
}

export async function referencesExist(tx: AdminTx, authorId: string, categoryIds: string[], tagIds: string[]) {
  const [author, categories, tags] = await Promise.all([
    tx.author.count({ where: { id: authorId } }),
    tx.category.count({ where: { id: { in: categoryIds } } }),
    tx.tag.count({ where: { id: { in: tagIds } } }),
  ]);
  return author === 1 && categories === categoryIds.length && tags === tagIds.length;
}

export function createResource(tx: AdminTx, input: ResourceCreateInput) {
  const { categoryIds, tagIds, authorId, ...data } = input;
  return tx.learningResource.create({
    data: {
      ...data,
      author: { connect: { id: authorId } },
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    select: { id: true, slug: true, status: true, categories: { select: { categoryId: true } }, tags: { select: { tagId: true } } },
  });
}

export function findResourceForUpdate(tx: AdminTx, id: string) {
  return tx.learningResource.findUnique({ where: { id }, select: { id: true, status: true, publishedAt: true, authorId: true } });
}

export async function updateResource(tx: AdminTx, id: string, input: ResourceUpdateInput) {
  const { categoryIds, tagIds, authorId, ...data } = input;
  if (categoryIds) {
    await tx.learningResourceCategory.deleteMany({ where: { resourceId: id } });
    await tx.learningResourceCategory.createMany({ data: categoryIds.map((categoryId) => ({ resourceId: id, categoryId })) });
  }
  if (tagIds) {
    await tx.learningResourceTag.deleteMany({ where: { resourceId: id } });
    await tx.learningResourceTag.createMany({ data: tagIds.map((tagId) => ({ resourceId: id, tagId })) });
  }
  return tx.learningResource.update({
    where: { id },
    data: { ...data, ...(authorId ? { author: { connect: { id: authorId } } } : {}) },
    select: { id: true, slug: true, status: true, categories: { select: { categoryId: true } }, tags: { select: { tagId: true } } },
  });
}

export function findResourceForDeletion(tx: AdminTx, id: string) {
  return tx.learningResource.findUnique({
    where: { id },
    select: { id: true, enrollments: { select: { id: true }, take: 1 }, bookmarks: { select: { id: true }, take: 1 }, lessons: { select: { _count: { select: { progress: true } } } } },
  });
}

export async function archiveOrDeleteResource(tx: AdminTx, id: string, hasHistory: boolean) {
  if (hasHistory) {
    await tx.learningResource.update({ where: { id }, data: { status: "ARCHIVED", isFeatured: false } });
    return "ARCHIVED" as const;
  }
  await tx.lesson.deleteMany({ where: { resourceId: id } });
  await tx.learningResource.delete({ where: { id } });
  return "DELETED" as const;
}

export function findResourceType(tx: AdminTx, id: string) {
  return tx.learningResource.findUnique({ where: { id }, select: { id: true, type: true } });
}

export function createLesson(tx: AdminTx, resourceId: string, input: LessonCreateInput) {
  return tx.lesson.create({ data: { resourceId, ...input }, select: { id: true, resourceId: true, slug: true, order: true, type: true } });
}

export function findLesson(tx: AdminTx, id: string) {
  return tx.lesson.findUnique({ where: { id }, select: { id: true, resourceId: true, title: true, slug: true, description: true, type: true, content: true, videoUrl: true, externalUrl: true, durationMinutes: true, order: true, isPreview: true, _count: { select: { progress: true } } } });
}

export function updateLesson(tx: AdminTx, id: string, input: LessonUpdateInput) {
  return tx.lesson.update({ where: { id }, data: input, select: { id: true, resourceId: true, slug: true, order: true, type: true } });
}

export function deleteLesson(tx: AdminTx, id: string) {
  return tx.lesson.delete({ where: { id }, select: { id: true } });
}

export function findLessonsForReorder(tx: AdminTx, resourceId: string) {
  return tx.lesson.findMany({ where: { resourceId }, select: { id: true, order: true } });
}

export async function reorderLessons(tx: AdminTx, resourceId: string, lessonIds: string[], temporaryStart: number) {
  for (const [index, id] of lessonIds.entries()) await tx.lesson.update({ where: { id }, data: { order: temporaryStart + index } });
  for (const [index, id] of lessonIds.entries()) await tx.lesson.update({ where: { id }, data: { order: index + 1 } });
  return tx.lesson.findMany({ where: { resourceId }, select: { id: true, order: true }, orderBy: { order: "asc" } });
}

export const createCategory = (data: { name: string; slug: string; description?: string | null }) => prisma.category.create({ data, select: { id: true, name: true, slug: true, description: true } });
export const updateCategory = (id: string, data: { name?: string; slug?: string; description?: string | null }) => prisma.category.update({ where: { id }, data, select: { id: true, name: true, slug: true, description: true } });
export const createTag = (data: { name: string; slug: string }) => prisma.tag.create({ data, select: { id: true, name: true, slug: true } });
export const updateTag = (id: string, data: { name?: string; slug?: string }) => prisma.tag.update({ where: { id }, data, select: { id: true, name: true, slug: true } });
export const createAuthor = (data: { name: string; slug: string; bio?: string | null; avatarUrl?: string | null }) => prisma.author.create({ data, select: { id: true, name: true, slug: true, bio: true, avatarUrl: true } });
export const updateAuthor = (id: string, data: { name?: string; slug?: string; bio?: string | null; avatarUrl?: string | null }) => prisma.author.update({ where: { id }, data, select: { id: true, name: true, slug: true, bio: true, avatarUrl: true } });
