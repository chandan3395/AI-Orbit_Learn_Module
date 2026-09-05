"use client";

export function EmptyState({ title, description }: { title: string; description?: string }) { return <div className="state-panel"><h2>{title}</h2>{description && <p>{description}</p>}</div>; }
export function ErrorState({ message = "We couldn't load this content.", retry }: { message?: string; retry?: () => void }) { return <div className="state-panel error-state"><h2>Something went wrong</h2><p>{message}</p>{retry && <button className="button secondary" onClick={retry}>Try again</button>}</div>; }
export function LoadingCards({ count = 6 }: { count?: number }) { return <div className="resource-grid" aria-label="Loading resources">{Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index}><div /><span /><span /><span /></div>)}</div>; }
