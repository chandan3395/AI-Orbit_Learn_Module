import Link from "next/link";
export default function NotFound() { return <div className="shell not-found"><p className="kicker">404</p><h1>Resource not found.</h1><p>This learning resource may have moved or is not publicly available.</p><Link className="button" href="/learn">Back to Learn</Link></div>; }
