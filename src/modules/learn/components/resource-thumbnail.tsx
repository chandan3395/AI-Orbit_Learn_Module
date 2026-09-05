"use client";

import { useState } from "react";

export function ResourceThumbnail({ src, title, type }: { src: string | null; title: string; type: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="thumbnail">{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <div className="thumbnail-fallback" aria-hidden="true"><span>{type}</span><strong>{title.slice(0, 2).toUpperCase()}</strong></div>}</div>;
}
