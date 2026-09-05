import { FilterBar } from "@/modules/learn/components/filter-bar";
import { Pagination } from "@/modules/learn/components/pagination";
import { ResourceGrid } from "@/modules/learn/components/resource-grid";
import { getCategories, getResources } from "@/modules/learn/api/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Learn · AI Orbit",
  description: "Explore practical AI courses, guides, and ebooks from AI Orbit.",
};

export default async function LearnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const values = Object.fromEntries(Object.entries(raw).flatMap(([key, value]) => typeof value === "string" && value ? [[key, value]] : []));
  const query = new URLSearchParams(values).toString();
  const [resources, categories] = await Promise.all([getResources(query), getCategories()]);
  return <div className="shell page-stack"><section className="page-heading"><p className="kicker">Knowledge for the next orbit</p><h1>Learn practical AI skills.</h1><p>Focused courses, guides, and field notes for building confidently with AI.</p></section><FilterBar values={values} categories={categories.data} /><div className="results-heading"><h2>{resources.pagination.total} resources</h2><span>Curated for applied learning</span></div><ResourceGrid resources={resources.data} /><Pagination pagination={resources.pagination} values={values} /></div>;
}
import type { Metadata } from "next";
