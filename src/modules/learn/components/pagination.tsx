import Link from "next/link";

import type { Pagination as PaginationData } from "../types/frontend";

export function Pagination({ pagination, values }: { pagination: PaginationData; values: Record<string, string> }) {
  if (pagination.totalPages <= 1) return null;
  const href = (page: number) => { const query = new URLSearchParams(values); query.set("page", String(page)); return `/learn?${query}`; };
  return <nav className="pagination" aria-label="Resource pages"><Link className={!pagination.hasPreviousPage ? "disabled" : ""} aria-disabled={!pagination.hasPreviousPage} href={pagination.hasPreviousPage ? href(pagination.page - 1) : "#"}>Previous</Link><span>Page {pagination.page} of {pagination.totalPages}</span><Link className={!pagination.hasNextPage ? "disabled" : ""} aria-disabled={!pagination.hasNextPage} href={pagination.hasNextPage ? href(pagination.page + 1) : "#"}>Next</Link></nav>;
}
