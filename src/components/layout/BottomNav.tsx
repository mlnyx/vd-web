"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, ClipboardList, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/assess", label: "VD 평가", icon: Camera },
  { href: "/history", label: "히스토리", icon: ClipboardList },
  { href: "/settings", label: "설정", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-heavy fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-primary-600" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="glass shadow-glass absolute -top-0.5 left-1/2 h-7 w-12 -translate-x-1/2 rounded-full" />
              )}
              <Icon className="relative z-10 size-5" />
              <span className="relative z-10 text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
