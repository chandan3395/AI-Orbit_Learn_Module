import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getRelated, getResource, ServerApiError } from "@/modules/learn/api/server";
import { LessonList } from "@/modules/learn/components/lesson-list";
import { ResourceActions } from "@/modules/learn/components/resource-actions";
import { ResourceGrid } from "@/modules/learn/components/resource-grid";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { data } = await getResource(slug);
    return { title: `${data.title} · AI Orbit Learn`, description: data.shortDescription };
  } catch {
    return { title: "Resource · AI Orbit Learn" };
  }
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const [resourceResponse, relatedResponse] = await Promise.all([getResource(slug), getRelated(slug)]);
    const resource = resourceResponse.data;
    return <div className="shell detail-page"><section className="detail-hero"><div><p className="kicker">{resource.type} · {resource.difficulty}</p><h1>{resource.title}</h1><p className="detail-lead">{resource.shortDescription}</p><div className="detail-meta"><span>By {resource.author.name}</span>{resource.durationMinutes != null && <span>{resource.durationMinutes} minutes</span>}<span>{resource.lessonCount} {resource.lessonCount === 1 ? "lesson" : "lessons"}</span></div><div className="chip-row">{resource.categories.map((item) => <span key={item.id}>{item.name}</span>)}{resource.tags.slice(0, 4).map((item) => <span className="tag" key={item.id}>#{item.name}</span>)}</div></div><div className="detail-monogram" aria-hidden="true">{resource.title.slice(0, 2).toUpperCase()}</div></section><ResourceActions slug={slug} type={resource.type} sourceUrl={resource.sourceUrl} lessons={resource.lessons} /><div className="detail-layout"><article className="prose"><h2>About this resource</h2><p>{resource.description}</p>{resource.author.bio && <div className="author-block"><span>About the author</span><h3>{resource.author.name}</h3><p>{resource.author.bio}</p></div>}</article>{resource.type === "COURSE" && <section><div className="section-title"><div><p className="kicker">Course outline</p><h2>{resource.lessonCount} lessons</h2></div></div><LessonList slug={slug} lessons={resource.lessons} /></section>}</div>{relatedResponse.data.length > 0 && <section className="related-section"><div className="section-title"><div><p className="kicker">Keep exploring</p><h2>Related resources</h2></div></div><ResourceGrid resources={relatedResponse.data} /></section>}</div>;
  } catch (error) { if (error instanceof ServerApiError && error.status === 404) notFound(); throw error; }
}
