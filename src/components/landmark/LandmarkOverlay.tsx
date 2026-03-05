import type { WillisKeypoints } from "@/lib/mediapipe/types";

interface LandmarkOverlayProps {
  keypoints: WillisKeypoints;
  width: number;
  height: number;
}

export function LandmarkOverlay({
  keypoints,
  width,
  height,
}: LandmarkOverlayProps) {
  // 정규화 좌표(0~1) → 화면 좌표 변환
  const toScreen = (point: { x: number; y: number }) => ({
    x: point.x * width,
    y: point.y * height,
  });

  const pupilCenter = {
    x: (keypoints.leftPupil.x + keypoints.rightPupil.x) / 2,
    y: (keypoints.leftPupil.y + keypoints.rightPupil.y) / 2,
  };

  const leftPupil = toScreen(keypoints.leftPupil);
  const rightPupil = toScreen(keypoints.rightPupil);
  const pupilMid = toScreen(pupilCenter);
  const subnasale = toScreen(keypoints.subnasale);
  const rimaOris = toScreen(keypoints.rimaOris);
  const chin = toScreen(keypoints.chin);

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg width={width} height={height}>
        {/* 동공간선 */}
        <line
          x1={leftPupil.x}
          y1={leftPupil.y}
          x2={rightPupil.x}
          y2={rightPupil.y}
          stroke="#60A5FA"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity={0.7}
        />

        {/* 동공 중심 → 비하점 (상부 거리) */}
        <line
          x1={pupilMid.x}
          y1={pupilMid.y}
          x2={subnasale.x}
          y2={subnasale.y}
          stroke="#22C55E"
          strokeWidth="2"
        />

        {/* 비하점 → 턱끝 (하부 거리) */}
        <line
          x1={subnasale.x}
          y1={subnasale.y}
          x2={chin.x}
          y2={chin.y}
          stroke="#F59E0B"
          strokeWidth="2"
        />

        {/* 키포인트 원 */}
        <g>
          <circle cx={leftPupil.x} cy={leftPupil.y} r="5" fill="#60A5FA" />
          <circle cx={rightPupil.x} cy={rightPupil.y} r="5" fill="#60A5FA" />
          <circle cx={subnasale.x} cy={subnasale.y} r="5" fill="#22C55E" />
          <circle
            cx={rimaOris.x}
            cy={rimaOris.y}
            r="4"
            fill="#A78BFA"
            opacity={0.7}
          />
          <circle cx={chin.x} cy={chin.y} r="5" fill="#F59E0B" />
        </g>

        {/* 라벨 */}
        <g>
          <text
            x={leftPupil.x - 25}
            y={leftPupil.y - 10}
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            동공
          </text>
          <text
            x={subnasale.x + 10}
            y={subnasale.y + 4}
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            비하점
          </text>
          <text
            x={chin.x + 10}
            y={chin.y + 4}
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            턱끝
          </text>
        </g>

        {/* 거리 라벨 */}
        <g>
          <text
            x={pupilMid.x + 15}
            y={(pupilMid.y + subnasale.y) / 2}
            fill="#22C55E"
            fontSize="11"
            fontWeight="bold"
          >
            A
          </text>
          <text
            x={subnasale.x + 15}
            y={(subnasale.y + chin.y) / 2}
            fill="#F59E0B"
            fontSize="11"
            fontWeight="bold"
          >
            B
          </text>
        </g>
      </svg>
    </div>
  );
}
