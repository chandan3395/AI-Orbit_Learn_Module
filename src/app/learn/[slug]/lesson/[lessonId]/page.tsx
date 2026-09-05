import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getResource, ServerApiError } from "@/modules/learn/api/server";
import { LessonExperience } from "@/modules/learn/components/lesson-experience";

export const dynamic = "force-dynamic";

type LessonParams = { params: Promise<{ slug: string; lessonId: string }> };

export async function generateMetadata({ params }: LessonParams): Promise<Metadata> {
  try {
    const { slug, lessonId } = await params;
    const { data } = await getResource(slug);
    const lesson = data.lessons.find((item) => item.id === lessonId);
    return lesson
      ? { title: `${lesson.title} · ${data.title}`, description: lesson.description ?? data.shortDescription }
      : { title: "Lesson · AI Orbit Learn" };
  } catch {
    return { title: "Lesson · AI Orbit Learn" };
  }
}

export default async function LessonPage({ params }: LessonParams) {
  const { slug, lessonId } = await params;
  try {
    const { data: resource } = await getResource(slug);
    if (resource.type !== "COURSE") notFound();
    const index = resource.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (index < 0) notFound();
    return <div className="shell"><LessonExperience resource={resource} lesson={resource.lessons[index]} previous={resource.lessons[index - 1] ?? null} next={resource.lessons[index + 1] ?? null} /></div>;
  } catch (error) { if (error instanceof ServerApiError && error.status === 404) notFound(); throw error; }
}
