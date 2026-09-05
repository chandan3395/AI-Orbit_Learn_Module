import type { ResourceCardData } from "../types/frontend";
import { EmptyState } from "./states";
import { ResourceCard } from "./resource-card";

export function ResourceGrid({ resources }: { resources: ResourceCardData[] }) {
  if (!resources.length) return <EmptyState title="No learning resources found." description="Try clearing a filter or using a broader search." />;
  return <div className="resource-grid">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div>;
}
