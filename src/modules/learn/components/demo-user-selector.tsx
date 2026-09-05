"use client";

import { DEMO_USERS } from "../demo-users";
import { useDemoUser } from "../hooks/demo-user-context";

export function DemoUserSelector() {
  const { userId, setUserId } = useDemoUser();
  return (
    <label className="demo-user"><span>Viewing as</span><select aria-label="Select demo learner" value={userId} onChange={(event) => setUserId(event.target.value)}>{DEMO_USERS.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
  );
}
