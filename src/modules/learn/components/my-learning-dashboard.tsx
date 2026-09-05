"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { learnApi } from "../api/client";
import { useDemoUser } from "../hooks/demo-user-context";
import type { ApiData, BookmarkItem, ContinueItem, LearningItem, Paginated } from "../types/frontend";
import { EmptyState, ErrorState } from "./states";
import { ProgressBar } from "./progress-bar";
import { ResourceCard } from "./resource-card";

export function MyLearningDashboard() {
  const { userId, userName } = useDemoUser();
  const [data, setData] = useState<{ active: LearningItem[]; completed: LearningItem[]; continuing: ContinueItem[]; bookmarks: BookmarkItem[] } | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setData(null); setError("");
    try {
      const [active, completed, continuing, bookmarks] = await Promise.all([
        learnApi<Paginated<LearningItem>>("/api/learn/me/learning?status=ACTIVE&limit=50", userId, { signal }),
        learnApi<Paginated<LearningItem>>("/api/learn/me/learning?status=COMPLETED&limit=50", userId, { signal }),
        learnApi<ApiData<ContinueItem[]>>("/api/learn/me/continue-learning", userId, { signal }),
        learnApi<Paginated<BookmarkItem>>("/api/learn/me/bookmarks?limit=50", userId, { signal }),
      ]);
      if (signal?.aborted) return;
      setData({ active: active.data, completed: completed.data, continuing: continuing.data, bookmarks: bookmarks.data });
    } catch (reason) {
      if (signal?.aborted) return;
      setError(reason instanceof Error ? reason.message : "Unable to load your learning");
    }
  }, [userId]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  if (error) return <ErrorState message={error} retry={load} />;
  if (!data) return <div className="dashboard-loading"><div /><div /><div /></div>;
  return <div className="dashboard-sections"><section><div className="section-title"><div><p className="kicker">Welcome back, {userName.split(" ")[0]}</p><h2>Continue Learning</h2></div></div>{data.continuing.length ? <div className="continue-grid">{data.continuing.map((item) => <Link className="continue-card" key={item.resource.id} href={item.nextIncompleteLesson ? `/learn/${item.resource.slug}/lesson/${item.nextIncompleteLesson.id}` : `/learn/${item.resource.slug}`}><span>{item.resource.difficulty}</span><h3>{item.resource.title}</h3><ProgressBar value={item.progressPercentage} /><small>{item.nextIncompleteLesson ? `Next: ${item.nextIncompleteLesson.title}` : "Open course"}</small></Link>)}</div> : <EmptyState title="No active courses yet." description="Start a course from the Learn library." />}</section><section><div className="section-title"><h2>Active Courses</h2><span>{data.active.length}</span></div>{data.active.length ? <div className="learning-list">{data.active.map((item) => <Link href={`/learn/${item.resource.slug}`} key={item.resource.id}><div><span>{item.resource.difficulty}</span><h3>{item.resource.title}</h3></div><ProgressBar value={item.progressPercentage} /></Link>)}</div> : <EmptyState title="No active courses yet." />}</section><section><div className="section-title"><h2>Completed</h2><span>{data.completed.length}</span></div>{data.completed.length ? <div className="learning-list compact">{data.completed.map((item) => <Link href={`/learn/${item.resource.slug}`} key={item.resource.id}><div><span>Completed</span><h3>{item.resource.title}</h3></div><strong>100%</strong></Link>)}</div> : <EmptyState title="No completed courses yet." />}</section><section><div className="section-title"><h2>Saved Resources</h2><span>{data.bookmarks.length}</span></div>{data.bookmarks.length ? <div className="resource-grid saved-grid">{data.bookmarks.map((item) => <ResourceCard key={item.id} resource={item.resource} />)}</div> : <EmptyState title="No saved resources yet." description="Save anything you want to revisit." />}</section></div>;
}
