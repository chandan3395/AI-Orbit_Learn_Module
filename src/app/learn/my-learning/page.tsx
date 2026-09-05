import type { Metadata } from "next";

import { MyLearningDashboard } from "@/modules/learn/components/my-learning-dashboard";
export const metadata: Metadata = {
  title: "My Learning · AI Orbit",
  description: "Continue active AI courses and revisit completed or saved learning resources.",
};
export default function MyLearningPage() { return <div className="shell page-stack"><section className="page-heading compact-heading"><p className="kicker">Your library</p><h1>My Learning</h1><p>Pick up where you left off, review completed courses, and revisit saved resources.</p></section><MyLearningDashboard /></div>; }
