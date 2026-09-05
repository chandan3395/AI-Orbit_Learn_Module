import type { Taxonomy } from "../types/frontend";

export function FilterBar({ values, categories }: { values: Record<string, string>; categories: Array<Taxonomy & { resourceCount: number }> }) {
  return (
    <form className="filter-bar" action="/learn" method="get">
      <label className="search-field"><span className="sr-only">Search resources</span><input name="search" defaultValue={values.search} placeholder="Search courses, guides, and ebooks" /></label>
      <label><span>Type</span><select name="type" defaultValue={values.type ?? ""}><option value="">All types</option><option value="COURSE">Courses</option><option value="GUIDE">Guides</option><option value="EBOOK">Ebooks</option></select></label>
      <label><span>Level</span><select name="difficulty" defaultValue={values.difficulty ?? ""}><option value="">All levels</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></label>
      <label><span>Category</span><select name="category" defaultValue={values.category ?? ""}><option value="">All categories</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name} ({category.resourceCount})</option>)}</select></label>
      <label><span>Sort</span><select name="sort" defaultValue={values.sort ?? "newest"}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option></select></label>
      <details className="more-filter"><summary>More filters</summary><label><span>Tag slug</span><input name="tag" defaultValue={values.tag} placeholder="e.g. rag" /></label><label className="check"><input type="checkbox" name="featured" value="true" defaultChecked={values.featured === "true"} /> Featured only</label></details>
      <div className="filter-actions"><button className="button" type="submit">Apply filters</button><a className="text-link" href="/learn">Clear</a></div>
    </form>
  );
}
