import Link from "next/link";

import type { Lesson } from "../types/frontend";

export function LessonList({ slug, lessons }: { slug: string; lessons: Lesson[] }) {
  return <ol className="lesson-list">{lessons.map((lesson) => <li key={lesson.id}><Link href={`/learn/${slug}/lesson/${lesson.id}`}><span className="lesson-order">{String(lesson.order).padStart(2, "0")}</span><span><strong>{lesson.title}</strong><small>{lesson.type} · {lesson.durationMinutes ?? "—"} min{lesson.isPreview ? " · Preview" : ""}</small></span><span aria-hidden="true">→</span></Link></li>)}</ol>;
}
