"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface TopBarProps {
  title: string;
  onBack?: () => void;
}

export function TopBar({ title, onBack }: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-12 items-center border-b border-white/6 bg-[#16181C]/90 backdrop-blur-md px-2">
      <button
        onClick={handleBack}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/80 hover:bg-white/6"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="flex-1 text-center text-sm font-semibold text-foreground pr-9">
        {title}
      </span>
    </div>
  );
}
