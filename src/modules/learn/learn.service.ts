import { ResourceDifficulty, ResourceType } from "@prisma/client";

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  RELATED_RESOURCE_LIMIT,
  RESOURCE_SORTS,
} from "./learn.constants";
import { LearnApiError } from "./learn.errors";
import {
  findCategoriesWithPublishedCounts,
  findPublishedResourceBySlug,
  findPublishedResourceContext,
  findPublicResources,
  findRelatedResources,
  type ResourceCardRecord,
  type ResourceDetailRecord,
} from "./learn.repository";
import type {
  PaginationMetadata,
  RawResourceListQuery,
  ResourceListQuery,
  ResourceSort,
} from "./learn.types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function invalidQuery(message: string): never {
  throw new LearnApiError(400, "INVALID_QUERY", message);
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
) {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value)) {
    return invalidQuery(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return invalidQuery(`${name} is too large`);
  }
  return parsed;
}

function parseEnum<T extends string>(
  value: string | undefined,
  values: readonly T[],
  name: string,
): T | undefined {
  if (value === undefined) return undefined;
  const normalized = value.toUpperCase() as T;
  if (!values.includes(normalized)) {
    return invalidQuery(`Unsupported ${name} value`);
  }
  return normalized;
}

function parseSlug(value: string | undefined, name: string) {
  if (value === undefined) return undefined;
  if (!slugPattern.test(value)) {
    return invalidQuery(`${name} must be a lowercase URL-safe slug`);
  }
  return value;
}

export function parseResourceListQuery(
  raw: RawResourceListQuery,
): ResourceListQuery {
  const page = parsePositiveInteger(raw.page, DEFAULT_PAGE, "page");
  const limit = parsePositiveInteger(raw.limit, DEFAULT_LIMIT, "limit");
  if (limit > MAX_LIMIT) {
    invalidQuery(`limit must be less than or equal to ${MAX_LIMIT}`);
  }

  const search = raw.search?.trim();
  if (search && search.length > 200) {
    invalidQuery("search must be 200 characters or fewer");
  }

  let featured: boolean | undefined;
  if (raw.featured !== undefined) {
    if (raw.featured !== "true" && raw.featured !== "false") {
      invalidQuery("featured must be true or false");
    }
    featured = raw.featured === "true";
  }

  const sort = raw.sort ?? "newest";
  if (!RESOURCE_SORTS.includes(sort as ResourceSort)) {
    invalidQuery("Unsupported sort value");
  }

  return {
    ...(search ? { search } : {}),
    type: parseEnum(raw.type, Object.values(ResourceType), "type"),
    difficulty: parseEnum(
      raw.difficulty,
      Object.values(ResourceDifficulty),
      "difficulty",
    ),
    category: parseSlug(raw.category, "category"),
    tag: parseSlug(raw.tag, "tag"),
    featured,
    sort: sort as ResourceSort,
    page,
    limit,
  };
}

function toResourceCard(record: ResourceCardRecord) {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    shortDescription: record.shortDescription,
    thumbnailUrl: record.thumbnailUrl,
    type: record.type,
    difficulty: record.difficulty,
    durationMinutes: record.durationMinutes,
    isFeatured: record.isFeatured,
    publishedAt: record.publishedAt,
    author: record.author,
    categories: record.categories.map(({ category }) => category),
    tags: record.tags.map(({ tag }) => tag),
    lessonCount: record._count.lessons,
  };
}

function toResourceDetail(record: ResourceDetailRecord) {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    shortDescription: record.shortDescription,
    description: record.description,
    thumbnailUrl: record.thumbnailUrl,
    type: record.type,
    difficulty: record.difficulty,
    durationMinutes: record.durationMinutes,
    sourceUrl: record.sourceUrl,
    isFeatured: record.isFeatured,
    publishedAt: record.publishedAt,
    author: record.author,
    categories: record.categories.map(({ category }) => category),
    tags: record.tags.map(({ tag }) => tag),
    lessons: record.lessons,
    lessonCount: record._count.lessons,
  };
}

export async function listPublicResources(raw: RawResourceListQuery = {}) {
  const query = parseResourceListQuery(raw);
  const { items, total } = await findPublicResources(query);
  const totalPages = Math.ceil(total / query.limit);
  const pagination: PaginationMetadata = {
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1,
  };

  return { data: items.map(toResourceCard), pagination };
}

export async function getPublicResource(slug: string) {
  const record = await findPublishedResourceBySlug(slug);
  if (!record) {
    throw new LearnApiError(
      404,
      "RESOURCE_NOT_FOUND",
      "Learning resource not found",
    );
  }
  return toResourceDetail(record);
}

export async function listPublicCategories() {
  const categories = await findCategoriesWithPublishedCounts();
  return categories.map(({ _count, ...category }) => ({
    ...category,
    resourceCount: _count.resources,
  }));
}

export async function getRelatedResources(slug: string) {
  const context = await findPublishedResourceContext(slug);
  if (!context) {
    throw new LearnApiError(
      404,
      "RESOURCE_NOT_FOUND",
      "Learning resource not found",
    );
  }

  const categoryIds = context.categories.map(({ categoryId }) => categoryId);
  const tagIds = context.tags.map(({ tagId }) => tagId);
  const related = await findRelatedResources({
    resourceId: context.id,
    type: context.type,
    categoryIds,
    tagIds,
    limit: RELATED_RESOURCE_LIMIT,
  });
  return related.map(toResourceCard);
}
