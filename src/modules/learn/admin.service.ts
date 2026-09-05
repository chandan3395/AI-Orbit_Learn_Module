import { LessonType, ResourceStatus, ResourceType } from "@prisma/client";
import { z } from "zod";

import { LearnApiError } from "./learn.errors";
import {
  adminTransaction, archiveOrDeleteResource, createAuthor, createCategory, createLesson, createResource, createTag,
  deleteLesson, findLesson, findLessonsForReorder, findResourceForDeletion, findResourceForUpdate, findResourceType,
  referencesExist, reorderLessons, updateAuthor, updateCategory, updateLesson, updateResource, updateTag,
} from "./admin.repository";
import { authorCreateSchema, authorUpdateSchema, categoryCreateSchema, categoryUpdateSchema, lessonCreateSchema, lessonUpdateSchema, resourceCreateSchema, resourceUpdateSchema, tagCreateSchema, tagUpdateSchema, type LessonCreateInput, type LessonUpdateInput, type ResourceCreateInput, type ResourceUpdateInput } from "./admin.validation";

const notFound = (message: string) => new LearnApiError(404, "RECORD_NOT_FOUND", message);
const invalidReference = () => new LearnApiError(400, "INVALID_REFERENCE", "Author, category, or tag reference is invalid");

export async function adminCreateResource(input: ResourceCreateInput) {
  return adminTransaction(async (tx) => {
    if (!(await referencesExist(tx, input.authorId, input.categoryIds, input.tagIds))) throw invalidReference();
    return createResource(tx, input);
  });
}

export async function adminUpdateResource(id: string, input: ResourceUpdateInput) {
  return adminTransaction(async (tx) => {
    const current = await findResourceForUpdate(tx, id);
    if (!current) throw notFound("Learning resource not found");
    const status = input.status ?? current.status;
    const publishedAt = input.publishedAt === undefined ? current.publishedAt : input.publishedAt;
    if (status === ResourceStatus.PUBLISHED && !publishedAt) throw new LearnApiError(400, "VALIDATION_ERROR", "Published resources require publishedAt");
    const authorId = input.authorId ?? current.authorId;
    if (!(await referencesExist(tx, authorId, input.categoryIds ?? [], input.tagIds ?? []))) {
      if (input.authorId || input.categoryIds || input.tagIds) throw invalidReference();
    }
    return updateResource(tx, id, input);
  });
}

export async function adminDeleteResource(id: string) {
  return adminTransaction(async (tx) => {
    const record = await findResourceForDeletion(tx, id);
    if (!record) throw notFound("Learning resource not found");
    const hasHistory = record.enrollments.length > 0 || record.bookmarks.length > 0 || record.lessons.some((lesson) => lesson._count.progress > 0);
    return { id, action: await archiveOrDeleteResource(tx, id, hasHistory) };
  });
}

export async function adminCreateLesson(resourceId: string, input: LessonCreateInput) {
  return adminTransaction(async (tx) => {
    const resource = await findResourceType(tx, resourceId);
    if (!resource) throw notFound("Learning resource not found");
    if (resource.type !== ResourceType.COURSE) throw new LearnApiError(400, "INVALID_LESSON_RESOURCE", "Lessons can belong only to courses");
    return createLesson(tx, resourceId, input);
  });
}

export async function adminUpdateLesson(id: string, input: LessonUpdateInput) {
  return adminTransaction(async (tx) => {
    const current = await findLesson(tx, id);
    if (!current) throw notFound("Lesson not found");
    const merged = { title: input.title ?? current.title, slug: input.slug ?? current.slug, description: input.description === undefined ? current.description : input.description, type: input.type ?? current.type, content: input.content === undefined ? current.content : input.content, videoUrl: input.videoUrl === undefined ? current.videoUrl : input.videoUrl, externalUrl: input.externalUrl === undefined ? current.externalUrl : input.externalUrl, durationMinutes: input.durationMinutes === undefined ? current.durationMinutes : input.durationMinutes, order: input.order ?? current.order, isPreview: input.isPreview ?? current.isPreview };
    lessonCreateSchema.parse(merged);
    return updateLesson(tx, id, input);
  });
}

export async function adminDeleteLesson(id: string) {
  return adminTransaction(async (tx) => {
    const lesson = await findLesson(tx, id);
    if (!lesson) throw notFound("Lesson not found");
    if (lesson._count.progress > 0) throw new LearnApiError(409, "LESSON_HAS_HISTORY", "Lesson with learning history cannot be deleted");
    return deleteLesson(tx, id);
  });
}

export async function adminReorderLessons(resourceId: string, lessonIds: string[]) {
  return adminTransaction(async (tx) => {
    const resource = await findResourceType(tx, resourceId);
    if (!resource) throw notFound("Learning resource not found");
    if (resource.type !== ResourceType.COURSE) throw new LearnApiError(400, "INVALID_LESSON_RESOURCE", "Lessons can belong only to courses");
    const existing = await findLessonsForReorder(tx, resourceId);
    if (existing.length !== lessonIds.length || !lessonIds.every((id) => existing.some((lesson) => lesson.id === id))) throw new LearnApiError(400, "VALIDATION_ERROR", "All course lessons must be included exactly once");
    const temporaryStart = Math.max(0, ...existing.map((lesson) => lesson.order)) + existing.length + 1;
    return reorderLessons(tx, resourceId, lessonIds, temporaryStart);
  });
}

export const adminCreateCategory = (input: z.infer<typeof categoryCreateSchema>) => createCategory(input);
export const adminUpdateCategory = ({ id, ...input }: z.infer<typeof categoryUpdateSchema>) => updateCategory(id, input);
export const adminCreateTag = (input: z.infer<typeof tagCreateSchema>) => createTag(input);
export const adminUpdateTag = ({ id, ...input }: z.infer<typeof tagUpdateSchema>) => updateTag(id, input);
export const adminCreateAuthor = (input: z.infer<typeof authorCreateSchema>) => createAuthor(input);
export const adminUpdateAuthor = ({ id, ...input }: z.infer<typeof authorUpdateSchema>) => updateAuthor(id, input);

export { authorCreateSchema, authorUpdateSchema, categoryCreateSchema, categoryUpdateSchema, lessonCreateSchema, lessonUpdateSchema, resourceCreateSchema, resourceUpdateSchema, tagCreateSchema, tagUpdateSchema };
