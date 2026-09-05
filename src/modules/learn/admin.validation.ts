import {
  LessonType,
  ResourceDifficulty,
  ResourceStatus,
  ResourceType,
} from "@prisma/client";
import { z } from "zod";

export const uuidSchema = z.uuid("A valid UUID is required");
export const idParamsSchema = z.object({ id: uuidSchema }).strict();
export const lessonIdParamsSchema = z.object({ lessonId: uuidSchema }).strict();
export const resourceIdParamsSchema = z.object({ resourceId: uuidSchema }).strict();
export const slugParamsSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }).strict();
const slug = z.string().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-safe");
const optionalUrl = z.union([z.url(), z.null()]).optional();
const date = z.union([z.iso.datetime({ offset: true }).transform((value) => new Date(value)), z.null()]);
const uniqueIds = z.array(uuidSchema).max(100).refine((ids) => new Set(ids).size === ids.length, "IDs must not contain duplicates");

const resourceFields = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  shortDescription: z.string().trim().min(10).max(500),
  description: z.string().trim().min(20).max(20_000),
  thumbnailUrl: optionalUrl,
  type: z.enum(ResourceType),
  difficulty: z.enum(ResourceDifficulty),
  status: z.enum(ResourceStatus),
  durationMinutes: z.number().int().positive().nullable().optional(),
  sourceUrl: optionalUrl,
  isFeatured: z.boolean(),
  authorId: uuidSchema,
  categoryIds: uniqueIds,
  tagIds: uniqueIds,
  publishedAt: date.optional(),
});

function publicationState(data: { status?: ResourceStatus; publishedAt?: Date | null }, context: z.RefinementCtx) {
  if (data.status === ResourceStatus.PUBLISHED && !data.publishedAt) {
    context.addIssue({ code: "custom", path: ["publishedAt"], message: "Published resources require publishedAt" });
  }
}

export const resourceCreateSchema = resourceFields.strict().superRefine(publicationState);
export const resourceUpdateSchema = resourceFields.partial().strict().refine((data) => Object.keys(data).length > 0, "At least one field is required");

const lessonFields = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  description: z.string().trim().max(2_000).nullable().optional(),
  type: z.enum(LessonType),
  content: z.string().trim().min(1).max(100_000).nullable().optional(),
  videoUrl: optionalUrl,
  externalUrl: optionalUrl,
  durationMinutes: z.number().int().positive().nullable().optional(),
  order: z.number().int().positive(),
  isPreview: z.boolean().optional(),
});

export function validateLessonType(data: z.infer<typeof lessonFields>, context: z.RefinementCtx) {
  if (data.type === LessonType.TEXT && !data.content) context.addIssue({ code: "custom", path: ["content"], message: "TEXT lessons require content" });
  if (data.type === LessonType.VIDEO && !data.videoUrl) context.addIssue({ code: "custom", path: ["videoUrl"], message: "VIDEO lessons require videoUrl" });
  if (data.type === LessonType.LINK && !data.externalUrl) context.addIssue({ code: "custom", path: ["externalUrl"], message: "LINK lessons require externalUrl" });
}

export const lessonCreateSchema = lessonFields.strict().superRefine(validateLessonType);
export const lessonUpdateSchema = lessonFields.partial().strict().refine((data) => Object.keys(data).length > 0, "At least one field is required");
export const lessonReorderSchema = z.object({ lessonIds: z.array(uuidSchema).min(1).refine((ids) => new Set(ids).size === ids.length, "Lesson IDs must be unique") }).strict();

const namedEntity = z.object({ name: z.string().trim().min(2).max(120), slug });
export const categoryCreateSchema = namedEntity.extend({ description: z.string().trim().max(2_000).nullable().optional() }).strict();
export const categoryUpdateSchema = categoryCreateSchema.partial().extend({ id: uuidSchema }).strict().refine((data) => Object.keys(data).length > 1, "At least one field is required");
export const tagCreateSchema = namedEntity.strict();
export const tagUpdateSchema = tagCreateSchema.partial().extend({ id: uuidSchema }).strict().refine((data) => Object.keys(data).length > 1, "At least one field is required");
export const authorCreateSchema = namedEntity.extend({ bio: z.string().trim().max(3_000).nullable().optional(), avatarUrl: optionalUrl }).strict();
export const authorUpdateSchema = authorCreateSchema.partial().extend({ id: uuidSchema }).strict().refine((data) => Object.keys(data).length > 1, "At least one field is required");

export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;
export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;
export type LessonUpdateInput = z.infer<typeof lessonUpdateSchema>;
