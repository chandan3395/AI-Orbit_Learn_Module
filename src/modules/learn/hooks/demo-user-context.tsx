"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { DEMO_USERS } from "../demo-users";

const storageKey = "ai-orbit-demo-user";
const DemoUserContext = createContext<{ userId: string; setUserId: (id: string) => void; userName: string } | null>(null);

export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>(DEMO_USERS[0].id);
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (DEMO_USERS.some((user) => user.id === saved)) setUserId(saved!);
  }, []);
  const selectUser = (id: string) => {
    setUserId(id);
    window.localStorage.setItem(storageKey, id);
  };
  const value = useMemo(() => ({ userId, setUserId: selectUser, userName: DEMO_USERS.find((user) => user.id === userId)?.name ?? DEMO_USERS[0].name }), [userId]);
  return <DemoUserContext.Provider value={value}>{children}</DemoUserContext.Provider>;
}

export function useDemoUser() {
  const context = useContext(DemoUserContext);
  if (!context) throw new Error("useDemoUser must be used inside DemoUserProvider");
  return context;
}
