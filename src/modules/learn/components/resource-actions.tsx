"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { learnApi } from "../api/client";
import { useDemoUser } from "../hooks/demo-user-context";
import type { ApiData, Lesson, ResourceDetail, UserState } from "../types/frontend";
import { ProgressBar } from "./progress-bar";

export function ResourceActions({ slug, type, sourceUrl, lessons }: { slug: string; type: ResourceDetail["type"]; sourceUrl: string | null; lessons: Lesson[] }) {
  const { userId } = useDemoUser();
  const [state, setState] = useState<UserState | null>(null);
  const [pending, setPending] = useState<"enroll" | "bookmark" | "remove" | null>(null);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await learnApi<ApiData<ResourceDetail>>(`/api/learn/resources/${slug}`, userId, { signal });
      if (signal?.aborted) return;
      setState(result.data.userState ?? null); setMessage("");
    }
    catch (error) {
      if (signal?.aborted) return;
      setMessage(error instanceof Error ? error.message : "Unable to load learner state");
    }
  }, [slug, userId]);
  useEffect(() => {
    const controller = new AbortController();
    setState(null); void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const bookmark = async () => {
    if (!state) return;
    const previous = state;
    const next = !state.bookmarked;
    setState({ ...state, bookmarked: next });
    setPending("bookmark");
    try { await learnApi(`/api/learn/resources/${slug}/bookmark`, userId, { method: next ? "POST" : "DELETE" }); setMessage(next ? "Saved to your library." : "Removed from saved resources."); }
    catch (error) { setState(previous); setMessage(error instanceof Error ? error.message : "Bookmark could not be updated"); }
    finally { setPending(null); }
  };
  const enroll = async () => {
    setPending("enroll");
    try { await learnApi(`/api/learn/resources/${slug}/enroll`, userId, { method: "POST" }); await refresh(); setMessage("You're enrolled. Your course is ready."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Enrollment failed"); }
    finally { setPending(null); }
  };
  const remove = async () => {
    setPending("remove");
    try { await learnApi(`/api/learn/resources/${slug}/enrollment`, userId, { method: "DELETE" }); await refresh(); setMessage("Enrollment removed."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Enrollment could not be removed"); }
    finally { setPending(null); }
  };
  const completedIds = new Set(state?.lessonProgress.filter((item) => item.status === "COMPLETED").map((item) => item.lessonId));
  const nextLesson = lessons.find((lesson) => !completedIds.has(lesson.id)) ?? lessons[0];

  return <aside className="action-panel" aria-busy={!state || pending !== null}><div className="action-row"><button className="button secondary" disabled={!state || pending !== null} onClick={bookmark}>{state?.bookmarked ? "Saved" : "Save resource"}</button>{type === "COURSE" && !state?.enrolled && <button className="button" disabled={!state || pending !== null} onClick={enroll}>{pending === "enroll" ? "Starting…" : "Start Learning"}</button>}{type === "COURSE" && state?.enrolled && nextLesson && <Link className="button" href={`/learn/${slug}/lesson/${nextLesson.id}`}>{state.enrollmentStatus === "COMPLETED" ? "Completed" : "Continue Learning"}</Link>}{type !== "COURSE" && sourceUrl && <a className="button" href={sourceUrl} target="_blank" rel="noreferrer">Open resource</a>}</div>{state?.enrolled && <><ProgressBar value={state.progressPercentage} /><div className="enrollment-note">{state.enrollmentStatus === "COMPLETED" ? "Course completed" : "Course in progress"}<button disabled={pending !== null} onClick={remove}>Remove enrollment</button></div></>}<p className="feedback" aria-live="polite">{!state && !message ? "Loading your learning state…" : message}</p></aside>;
}
