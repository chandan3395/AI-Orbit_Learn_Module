"use client";
import { ErrorState } from "@/modules/learn/components/states";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="shell page-stack"><ErrorState message="The learning library is temporarily unavailable." retry={reset} /></div>; }
