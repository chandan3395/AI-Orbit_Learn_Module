import { Prisma, ResourceStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { ResourceListQuery } from "./learn.types";

export const resourceCardSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  thumbnailUrl: true,
  type: true,
  difficulty: true,
  durationMinutes: true,
  isFeatured: true,
  publishedAt: true,
  author: {
    select: { id: true, name: true, slug: true, avatarUrl: true },
  },
  categories: {
    select: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { category: { name: "asc" as const } },
  },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
    orderBy: { tag: { name: "asc" as const } },
  },
  _count: { select: { lessons: true } },
} satisfies Prisma.LearningResourceSelect;

const resourceDetailSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  thumbnailUrl: true,
  type: true,
  difficulty: true,
  durationMinutes: true,
  sourceUrl: true,
  isFeatured: true,
  publishedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      avatarUrl: true,
    },
  },
  categories: {
    select: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { category: { name: "asc" as const } },
  },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
    orderBy: { tag: { name: "asc" as const } },
  },
  lessons: {
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      content: true,
      videoUrl: true,
      externalUrl: true,
      durationMinutes: true,
      order: true,
      isPreview: true,
    },
    orderBy: { order: "asc" as const },
  },
  _count: { select: { lessons: true } },
} satisfies Prisma.LearningResourceSelect;

export type ResourceCardRecord = Prisma.LearningResourceGetPayload<{
  select: typeof resourceCardSelect;
}>;
export type ResourceDetailRecord = Prisma.LearningResourceGetPayload<{
  select: typeof resourceDetailSelect;
}>;

function createPublicResourceWhere(
  query: ResourceListQuery,
): Prisma.LearningResourceWhereInput {
  return {
    status: ResourceStatus.PUBLISHED,
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            {
              shortDescription: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    ...(query.featured !== undefined
      ? { isFeatured: query.featured }
      : {}),
    ...(query.category
      ? { categories: { some: { category: { slug: query.category } } } }
      : {}),
    ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
  };
}

function createOrderBy(
  sort: ResourceListQuery["sort"],
): Prisma.LearningResourceOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ publishedAt: "asc" }, { id: "asc" }];
    case "title-asc":
      return [{ title: "asc" }, { id: "asc" }];
    case "title-desc":
      return [{ title: "desc" }, { id: "asc" }];
    case "newest":
    default:
      return [{ publishedAt: "desc" }, { id: "asc" }];
  }
}

export async function findPublicResources(query: ResourceListQuery) {
  const where = createPublicResourceWhere(query);
  const [items, total] = await Promise.all([
    prisma.learningResource.findMany({
      where,
      select: resourceCardSelect,
      orderBy: createOrderBy(query.sort),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.learningResource.count({ where }),
  ]);

  return { items, total };
}

export function findPublishedResourceBySlug(slug: string) {
  return prisma.learningResource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED },
    select: resourceDetailSelect,
  });
}

export async function findCategoriesWithPublishedCounts() {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          resources: {
            where: { resource: { status: ResourceStatus.PUBLISHED } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export function findPublishedResourceContext(slug: string) {
  return prisma.learningResource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED },
    select: {
      id: true,
      type: true,
      categories: { select: { categoryId: true } },
      tags: { select: { tagId: true } },
    },
  });
}

export async function findRelatedResources(input: {
  resourceId: string;
  type: ResourceCardRecord["type"];
  categoryIds: string[];
  tagIds: string[];
  limit: number;
}) {
  const categoryIds = input.categoryIds.map(
    (id) => Prisma.sql`${id}::uuid`,
  );
  const tagIds = input.tagIds.map((id) => Prisma.sql`${id}::uuid`);
  const categoryJoin = categoryIds.length
    ? Prisma.sql`LEFT JOIN "LearningResourceCategory" rc ON rc."resourceId" = r.id AND rc."categoryId" IN (${Prisma.join(categoryIds)})`
    : Prisma.sql`LEFT JOIN "LearningResourceCategory" rc ON FALSE`;
  const tagJoin = tagIds.length
    ? Prisma.sql`LEFT JOIN "LearningResourceTag" rt ON rt."resourceId" = r.id AND rt."tagId" IN (${Prisma.join(tagIds)})`
    : Prisma.sql`LEFT JOIN "LearningResourceTag" rt ON FALSE`;

  const ranked = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT r.id,
      (
        COUNT(DISTINCT rc."categoryId") * 100
        + COUNT(DISTINCT rt."tagId") * 10
        + CASE WHEN r.type = ${input.type}::"ResourceType" THEN 1 ELSE 0 END
      )::integer AS relevance
    FROM "LearningResource" r
    ${categoryJoin}
    ${tagJoin}
    WHERE r.id <> ${input.resourceId}::uuid
      AND r.status = 'PUBLISHED'::"ResourceStatus"
      AND (
        rc."categoryId" IS NOT NULL
        OR rt."tagId" IS NOT NULL
        OR r.type = ${input.type}::"ResourceType"
      )
    GROUP BY r.id
    ORDER BY relevance DESC, r."publishedAt" DESC NULLS LAST, r.title ASC
    LIMIT ${input.limit}
  `);

  if (ranked.length === 0) return [];
  const records = await prisma.learningResource.findMany({
    where: { id: { in: ranked.map(({ id }) => id) } },
    select: resourceCardSelect,
  });
  const recordById = new Map(records.map((record) => [record.id, record]));
  return ranked.flatMap(({ id }) => {
    const record = recordById.get(id);
    return record ? [record] : [];
  });
}
