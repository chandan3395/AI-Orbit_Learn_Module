import { headers } from "next/headers";

import type { ApiData, Paginated, ResourceCardData, ResourceDetail, Taxonomy } from "../types/frontend";

async function origin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const values = await headers();
  const host = values.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function serverFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${await origin()}${path}`, { cache: "no-store" });
  if (!response.ok) throw new ServerApiError(response.status);
  return response.json() as Promise<T>;
}

export class ServerApiError extends Error { constructor(public status: number) { super(`Request failed with status ${status}`); } }

export const getResources = (query: string) => serverFetch<Paginated<ResourceCardData>>(`/api/learn/resources${query ? `?${query}` : ""}`);
export const getCategories = () => serverFetch<ApiData<Array<Taxonomy & { resourceCount: number }>>>("/api/learn/categories");
export const getResource = (slug: string) => serverFetch<ApiData<ResourceDetail>>(`/api/learn/resources/${encodeURIComponent(slug)}`);
export const getRelated = (slug: string) => serverFetch<ApiData<ResourceCardData[]>>(`/api/learn/resources/${encodeURIComponent(slug)}/related`);
