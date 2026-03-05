"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, ClipboardList, Settings } from "lucide-react";
import { CnalyticsLogo } from "@/components/brand/CnalyticsLogo";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/assess", label: "VD 평가", icon: Camera },
  { href: "/history", label: "히스토리", icon: ClipboardList },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-heavy shadow-glass hidden lg:flex lg:w-60 lg:flex-col">
      <div className="px-3 py-5">
        <div className="px-3">
          <CnalyticsLogo variant="horizontal" size={28} />
          <p className="mt-1 text-xs text-muted-foreground">VD Assessment</p>
        </div>
      </div>
      <nav className="flex-1 px-3">
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
              className={`mb-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "glass bg-primary-100/50 shadow-glass text-primary-700"
                  : "text-muted-foreground hover:glass-subtle hover:text-foreground"
              }`}
            >
              <Icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
