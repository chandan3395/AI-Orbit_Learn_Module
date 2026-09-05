import Link from "next/link";

import type { ResourceCardData } from "../types/frontend";
import { ResourceThumbnail } from "./resource-thumbnail";

export function ResourceCard({ resource }: { resource: ResourceCardData }) {
  return (
    <article className="resource-card">
      <Link href={`/learn/${resource.slug}`} className="card-link" aria-label={`Open ${resource.title}`}>
        <ResourceThumbnail src={resource.thumbnailUrl} title={resource.title} type={resource.type} />
        <div className="card-body">
          <div className="eyebrow"><span>{resource.type}</span>{resource.isFeatured && <span className="featured">Featured</span>}</div>
          <h2>{resource.title}</h2>
          <p>{resource.shortDescription}</p>
          <div className="card-author">By {resource.author.name}</div>
          <div className="card-meta"><span>{resource.difficulty}</span>{resource.durationMinutes != null && <span>{resource.durationMinutes} min</span>}{resource.type === "COURSE" && <span>{resource.lessonCount} lessons</span>}</div>
        </div>
      </Link>
    </article>
  );
}
