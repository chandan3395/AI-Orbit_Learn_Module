import type {
  ResourceDifficulty,
  ResourceType,
} from "@prisma/client";

import type { RESOURCE_SORTS } from "./learn.constants";

export type ResourceSort = (typeof RESOURCE_SORTS)[number];

export type RawResourceListQuery = Partial<
  Record<
    | "search"
    | "type"
    | "difficulty"
    | "category"
    | "tag"
    | "featured"
    | "sort"
    | "page"
    | "limit",
    string
  >
>;

export type ResourceListQuery = {
  search?: string;
  type?: ResourceType;
  difficulty?: ResourceDifficulty;
  category?: string;
  tag?: string;
  featured?: boolean;
  sort: ResourceSort;
  page: number;
  limit: number;
};

export type PaginationMetadata = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
