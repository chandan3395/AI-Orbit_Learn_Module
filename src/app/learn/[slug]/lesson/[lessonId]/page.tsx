import { notFound } from "next/navigation";

import { getResource, ServerApiError } from "@/modules/learn/api/server";
import { LessonExperience } from "@/modules/learn/components/lesson-experience";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  try {
    const { data: resource } = await getResource(slug);
    if (resource.type !== "COURSE") notFound();
    const index = resource.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (index < 0) notFound();
    return <div className="shell"><LessonExperience resource={resource} lesson={resource.lessons[index]} previous={resource.lessons[index - 1] ?? null} next={resource.lessons[index + 1] ?? null} /></div>;
  } catch (error) { if (error instanceof ServerApiError && error.status === 404) notFound(); throw error; }
}
