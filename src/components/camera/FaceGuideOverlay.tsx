export function FaceGuideOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg width="280" height="380" viewBox="0 0 280 380">
        {/* 타원형 얼굴 가이드 */}
        <ellipse
          cx="140"
          cy="180"
          rx="110"
          ry="155"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="8 6"
          fill="none"
          opacity={0.6}
        />

        {/* 동공 수평 기준선 */}
        <line
          x1="50"
          y1="130"
          x2="230"
          y2="130"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity={0.3}
        />

        {/* 중앙 수직선 */}
        <line
          x1="140"
          y1="30"
          x2="140"
          y2="340"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity={0.2}
        />

        {/* 안내 텍스트 */}
        <text
          x="140"
          y="365"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          opacity={0.7}
        >
          얼굴을 타원 안에 맞춰주세요
        </text>
      </svg>
    </div>
  );
}
