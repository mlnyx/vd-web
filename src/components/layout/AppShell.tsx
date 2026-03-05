"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // /assess에서 카메라 활성 시 네비게이션 숨김
  const hideNav = pathname === "/assess";

  if (hideNav) {
    return <main className="min-h-dvh">{children}</main>;
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
