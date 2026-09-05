import type { Metadata } from "next";
import Link from "next/link";

import { DemoUserProvider } from "@/modules/learn/hooks/demo-user-context";
import { DemoUserSelector } from "@/modules/learn/components/demo-user-selector";

import "./globals.css";

export const metadata: Metadata = { title: "Learn · AI Orbit", description: "Practical AI learning resources, courses, and guides." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <DemoUserProvider>
          <header className="site-header">
            <div className="shell header-inner">
              <Link className="brand" href="/learn" aria-label="AI Orbit Learn home"><span className="brand-mark">●</span> AI ORBIT <span>LEARN</span></Link>
              <nav aria-label="Primary navigation"><Link href="/learn">Explore</Link><Link href="/learn/my-learning">My Learning</Link></nav>
              <DemoUserSelector />
            </div>
          </header>
          <main>{children}</main>
        </DemoUserProvider>
      </body>
    </html>
  );
}
