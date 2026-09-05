import assert from "node:assert/strict";
import { after, test } from "node:test";

import { ResourceType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { LearnApiError } from "./learn.errors";
import {
  getPublicResource,
  getRelatedResources,
  listPublicCategories,
  listPublicResources,
} from "./learn.service";

after(async () => {
  await prisma.$disconnect();
});

test("default listing returns the first published page", async () => {
  const result = await listPublicResources();
  assert.equal(result.data.length, 12);
  assert.equal(result.pagination.total, 23);
  assert.equal(result.pagination.page, 1);
  assert.equal(result.pagination.hasNextPage, true);
  assert.ok(
    result.data.every(
      (item) =>
        item.slug !== "advanced-rag-evaluation" &&
        item.slug !== "responsible-ai-checklist",
    ),
  );
});

test("pagination uses page and limit on the server", async () => {
  const result = await listPublicResources({ page: "2", limit: "5" });
  assert.equal(result.data.length, 5);
  assert.deepEqual(result.pagination, {
    page: 2,
    limit: 5,
    total: 23,
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: true,
  });
});

test("search finds matching published resources", async () => {
  const result = await listPublicResources({ search: "agent", limit: "50" });
  assert.ok(result.pagination.total >= 2);
  assert.ok(result.data.some((item) => item.slug === "build-your-first-ai-agent"));
});

test("type filtering returns only the requested type", async () => {
  const result = await listPublicResources({ type: "COURSE", limit: "50" });
  assert.ok(result.data.length > 0);
  assert.ok(result.data.every((item) => item.type === ResourceType.COURSE));
});

test("category filtering uses the category slug", async () => {
  const result = await listPublicResources({
    category: "ai-agents",
    limit: "50",
  });
  assert.equal(result.pagination.total, 2);
  assert.ok(
    result.data.every((item) =>
      item.categories.some((category) => category.slug === "ai-agents"),
    ),
  );
});

test("invalid query parameters return a typed 400 error", async () => {
  await assert.rejects(
    () => listPublicResources({ page: "0" }),
    (error) =>
      error instanceof LearnApiError &&
      error.status === 400 &&
      error.code === "INVALID_QUERY",
  );
  await assert.rejects(() => listPublicResources({ featured: "yes" }), {
    name: "LearnApiError",
  });
  await assert.rejects(() => listPublicResources({ sort: "popular" }), {
    name: "LearnApiError",
  });
});

test("draft and archived resources are unavailable publicly", async () => {
  await assert.rejects(
    () => getPublicResource("advanced-rag-evaluation"),
    (error) =>
      error instanceof LearnApiError && error.code === "RESOURCE_NOT_FOUND",
  );
  await assert.rejects(() => getPublicResource("responsible-ai-checklist"), {
    name: "LearnApiError",
  });
});

test("resource detail returns ordered lessons and public relations", async () => {
  const detail = await getPublicResource("prompt-engineering-fundamentals");
  assert.equal(detail.lessonCount, 5);
  assert.equal(detail.author.slug, "elena-marquez");
  assert.deepEqual(
    detail.lessons.map((lesson) => lesson.order),
    [1, 2, 3, 4, 5],
  );
});

test("missing resource detail returns 404", async () => {
  await assert.rejects(
    () => getPublicResource("does-not-exist"),
    (error) => error instanceof LearnApiError && error.status === 404,
  );
});

test("category counts include published resources only", async () => {
  const categories = await listPublicCategories();
  assert.deepEqual(
    [...categories].map((category) => category.name),
    [...categories].map((category) => category.name).sort(),
  );
  assert.equal(
    categories.find((category) => category.slug === "ai-agents")
      ?.resourceCount,
    2,
  );
});

test("related resources are ranked and exclude the current resource", async () => {
  const related = await getRelatedResources("build-your-first-ai-agent");
  assert.ok(related.length > 0 && related.length <= 4);
  assert.ok(related.every((item) => item.slug !== "build-your-first-ai-agent"));
});
