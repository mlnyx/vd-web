"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAssess = pathname === "/assess";

  return (
    <div className="flex min-h-dvh">
      {!isAssess && <Sidebar />}
      <main className={`flex-1 ${isAssess ? "" : "pb-16 lg:pb-0"}`}>
        {children}
      </main>
      {!isAssess && <BottomNav />}
    </div>
  );
}
