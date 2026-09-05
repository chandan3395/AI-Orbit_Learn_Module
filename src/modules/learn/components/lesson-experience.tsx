"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { learnApi } from "../api/client";
import { useDemoUser } from "../hooks/demo-user-context";
import type { ApiData, Lesson, ResourceDetail, UserState } from "../types/frontend";
import { ProgressBar } from "./progress-bar";

export function LessonExperience({ resource, lesson, previous, next }: { resource: ResourceDetail; lesson: Lesson; previous: Lesson | null; next: Lesson | null }) {
  const { userId } = useDemoUser();
  const [state, setState] = useState<UserState | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await learnApi<ApiData<ResourceDetail>>(`/api/learn/resources/${resource.slug}`, userId, { signal });
      if (signal?.aborted) return;
      setState(response.data.userState ?? null); setMessage("");
    }
    catch (error) {
      if (signal?.aborted) return;
      setMessage(error instanceof Error ? error.message : "Unable to load progress");
    }
  }, [resource.slug, userId]);
  useEffect(() => {
    const controller = new AbortController();
    setState(null); void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  const current = state?.lessonProgress.find((item) => item.lessonId === lesson.id);
  const update = async (status: "IN_PROGRESS" | "COMPLETED") => {
    setPending(true);
    try {
      const response = await learnApi<ApiData<{ progress: { lessonId: string; status: "IN_PROGRESS" | "COMPLETED"; positionSeconds: number }; enrollment: { progressPercentage: number; status: "ACTIVE" | "COMPLETED" } }>>(`/api/learn/lessons/${lesson.id}/progress`, userId, { method: "PATCH", body: JSON.stringify({ status }) });
      setState((value) => value ? { ...value, progressPercentage: response.data.enrollment.progressPercentage, enrollmentStatus: response.data.enrollment.status, lessonProgress: [...value.lessonProgress.filter((item) => item.lessonId !== lesson.id), response.data.progress] } : value);
      setMessage(status === "COMPLETED" ? (next ? "Lesson complete. Continue when you're ready." : "Course complete — well done.") : "Lesson marked in progress.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Progress could not be updated"); }
    finally { setPending(false); }
  };
  return <div className="lesson-layout"><aside className="lesson-sidebar"><Link className="back-link" href={`/learn/${resource.slug}`}>← Course overview</Link><p className="course-name">{resource.title}</p><p className="kicker">Lesson {lesson.order} of {resource.lessonCount}</p><h1>{lesson.title}</h1><ProgressBar value={state?.progressPercentage ?? 0} /><div className={`lesson-status ${current?.status?.toLowerCase().replace("_", "-") ?? "not-started"}`}>{current?.status?.replace("_", " ") ?? "NOT STARTED"}</div></aside><article className="lesson-content"><div className="lesson-type">{lesson.type} · {lesson.durationMinutes ?? "—"} min</div>{lesson.description && <p className="lesson-intro">{lesson.description}</p>}{lesson.type === "TEXT" && <div className="lesson-copy"><p>{lesson.content}</p></div>}{lesson.type === "VIDEO" && <div className="media-panel"><strong>Video lesson</strong><p>Open the lesson video in a new tab. Your completion is tracked here.</p>{lesson.videoUrl && <a className="button secondary" href={lesson.videoUrl} target="_blank" rel="noreferrer">Open video ↗</a>}</div>}{lesson.type === "LINK" && <div className="media-panel"><strong>External learning activity</strong><p>Complete the linked exercise, then return here to mark the lesson complete.</p>{lesson.externalUrl && <a className="button secondary" href={lesson.externalUrl} target="_blank" rel="noreferrer">Open activity ↗</a>}</div>}<div className="lesson-actions">{state?.enrolled ? <>{!current && <button className="button secondary" disabled={pending} onClick={() => update("IN_PROGRESS")}>Begin lesson</button>}<button className="button" disabled={pending || current?.status === "COMPLETED"} onClick={() => update("COMPLETED")}>{pending ? "Saving…" : current?.status === "COMPLETED" ? "Completed" : "Mark Complete"}</button></> : <Link className="button" href={`/learn/${resource.slug}`}>Enroll to track progress</Link>}</div><p className="feedback" aria-live="polite">{message}</p><nav className="lesson-nav" aria-label="Lesson navigation">{previous ? <Link href={`/learn/${resource.slug}/lesson/${previous.id}`}>← <span>Previous<br /><strong>{previous.title}</strong></span></Link> : <span />}{next ? <Link href={`/learn/${resource.slug}/lesson/${next.id}`}><span>Next<br /><strong>{next.title}</strong></span> →</Link> : <Link href={`/learn/${resource.slug}`}><span>Finish<br /><strong>Course overview</strong></span> →</Link>}</nav></article></div>;
}
