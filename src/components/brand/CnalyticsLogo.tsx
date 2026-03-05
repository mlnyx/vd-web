// Cnalytics 브랜드 로고 컴포넌트
import Image from "next/image";

interface CnalyticsLogoProps {
  variant?: "horizontal" | "icon" | "text";
  className?: string;
  size?: number;
}

export function CnalyticsLogo({
  variant = "horizontal",
  className = "",
  size = 32,
}: CnalyticsLogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src="/images/logo-icon.png"
        alt="Cnalytics"
        width={size}
        height={size}
        className={className}
        priority
      />
    );
  }

  if (variant === "text") {
    return (
      <Image
        src="/images/logo-text.png"
        alt="Cnalytics"
        width={size * 4}
        height={size}
        className={`object-contain ${className}`}
        priority
      />
    );
  }

  // horizontal: 아이콘+텍스트 가로형
  return (
    <Image
      src="/images/logo-horizontal.png"
      alt="Cnalytics"
      width={size * 5}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  );
}
