import type {
  FaceLandmarks,
  WillisKeypoints,
  NormalizedLandmark,
  HeadPose,
} from "@/lib/mediapipe/types";
import { validateHeadPose, getPoseHintMessage } from "@/lib/mediapipe/headPose";

// 가이드 타원 공유 상수 (width 기준으로 통일)
export const GUIDE_CY_RATIO = 0.42;
export const GUIDE_RX_RATIO = 0.32;
export const GUIDE_RY_RATIO = 0.42;

// 해상도 독립 스케일 팩터 (640px 기준)
function getScale(width: number): number {
  return width / 640;
}

// 글로우 효과가 있는 선 그리기 헬퍼
function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  lineWidth: number,
  glowSize: number,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = glowSize;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 글로우 효과가 있는 키포인트 그리기 헬퍼
function drawGlowPoint(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string,
  radius: number,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = radius * 0.3;
  ctx.stroke();
  ctx.restore();
}

// 글래스 pill 배경 헬퍼
function drawGlassPill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  borderColor?: string,
) {
  const r = h / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.strokeStyle = borderColor ?? "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  keypoints: WillisKeypoints,
  width: number,
  height: number,
  ratio: number,
  verdict: "NORMAL" | "LOWER"
) {
  // 미러링 보정: x → 1 - x
  const mirror = (lm: NormalizedLandmark) => ({
    x: (1 - lm.x) * width,
    y: lm.y * height,
  });

  const leftPupil = mirror(keypoints.leftPupil);
  const rightPupil = mirror(keypoints.rightPupil);
  const pupilMid = {
    x: (leftPupil.x + rightPupil.x) / 2,
    y: (leftPupil.y + rightPupil.y) / 2,
  };
  const rimaOris = mirror(keypoints.rimaOris);
  const subnasale = mirror(keypoints.subnasale);
  const chin = mirror(keypoints.chin);

  const s = getScale(width);

  // 동공간선 (파란색 점선 + 글로우)
  ctx.save();
  ctx.setLineDash([6 * s, 4 * s]);
  ctx.lineCap = "round";
  ctx.shadowColor = "#60A5FA";
  ctx.shadowBlur = 8 * s;
  ctx.strokeStyle = "rgba(96, 165, 250, 0.8)";
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(leftPupil.x, leftPupil.y);
  ctx.lineTo(rightPupil.x, rightPupil.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 동공~구열 거리 (녹색 글로우 라인)
  drawGlowLine(ctx, pupilMid.x, pupilMid.y, rimaOris.x, rimaOris.y, "#22C55E", 1.5 * s, 6 * s);

  // 비하점~턱끝 거리 (주황 글로우 라인)
  drawGlowLine(ctx, subnasale.x, subnasale.y, chin.x, chin.y, "#F59E0B", 1.5 * s, 6 * s);

  // 키포인트 원 (글로우 + 흰색 외곽)
  const points = [
    { p: leftPupil, color: "#60A5FA" },
    { p: rightPupil, color: "#60A5FA" },
    { p: rimaOris, color: "#22C55E" },
    { p: subnasale, color: "#F59E0B" },
    { p: chin, color: "#F59E0B" },
  ];
  for (const { p, color } of points) {
    drawGlowPoint(ctx, p.x, p.y, color, 4 * s);
  }

  // 비율 표시 (가이드 타원 내부 상단 글래스 pill)
  const verdictColor = verdict === "NORMAL" ? "#22C55E" : "#EF4444";
  const pillW = 120 * s;
  const pillH = 44 * s;
  const pillX = width / 2 - pillW / 2;
  const guideCy = height * GUIDE_CY_RATIO;
  const guideRy = width * GUIDE_RY_RATIO;
  const pillY = guideCy - guideRy + 24 * s;

  drawGlassPill(ctx, pillX, pillY, pillW, pillH, verdict === "NORMAL" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)");

  // "Willis Ratio" 라벨
  ctx.font = `${9 * s}px -apple-system, 'SF Pro Text', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Willis Ratio", width / 2, pillY + 7 * s);

  // 비율 값
  ctx.font = `bold ${18 * s}px -apple-system, 'SF Pro Display', sans-serif`;
  ctx.fillStyle = verdictColor;
  ctx.textBaseline = "bottom";
  ctx.fillText(ratio.toFixed(3), width / 2, pillY + pillH - 5 * s);
}

// 가이드 타원 (Apple Face ID 세그먼트 틱 스타일)
export function drawGuideEllipse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  detected: boolean,
) {
  const s = getScale(width);
  const cx = width / 2;
  const cy = height * GUIDE_CY_RATIO;
  const rx = width * GUIDE_RX_RATIO;
  const ry = width * GUIDE_RY_RATIO;
  const segments = 60;
  const gap = (Math.PI * 2) / segments;
  const arcLen = gap * 0.55;

  const color = detected ? "rgba(34,197,94,0.7)" : "rgba(255,255,255,0.3)";

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 3.5 * s;
  ctx.strokeStyle = color;
  if (detected) {
    ctx.shadowColor = "rgba(34,197,94,0.5)";
    ctx.shadowBlur = 12 * s;
  }

  for (let i = 0; i < segments; i++) {
    const startAngle = gap * i;
    const endAngle = startAngle + arcLen;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, startAngle, endAngle);
    ctx.stroke();
  }
  ctx.restore();
}

// 얼굴 미감지 안내 메시지 (글래스 pill)
export function drawNoFaceHint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const s = getScale(width);
  const text = "얼굴을 타원 안에 위치시켜 주세요";
  const icon = "👤";
  const fullText = `${icon}  ${text}`;

  ctx.font = `${14 * s}px -apple-system, 'SF Pro Text', sans-serif`;
  const measured = ctx.measureText(fullText);
  const boxW = measured.width + 40 * s;
  const boxH = 40 * s;
  const boxX = width / 2 - boxW / 2;
  const boxY = height * 0.82;

  drawGlassPill(ctx, boxX, boxY, boxW, boxH);

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fullText, width / 2, boxY + boxH / 2);
}

// 자세 교정 안내 (하단 글래스 토스트)
export function drawPoseHint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pose: HeadPose
) {
  const message = getPoseHintMessage(pose);
  if (!message) return;

  let icon = "⊙";
  const validation = validateHeadPose(pose);
  if (!validation.pitchOk) {
    icon = pose.pitch > 0 ? "↓" : "↑";
  } else if (!validation.yawOk) {
    icon = pose.yaw > 0 ? "←" : "→";
  } else if (!validation.rollOk) {
    icon = pose.roll > 0 ? "↺" : "↻";
  }

  const s = getScale(width);
  const fullText = `${icon}  ${message}`;
  ctx.font = `bold ${14 * s}px -apple-system, 'SF Pro Text', sans-serif`;
  const measured = ctx.measureText(fullText);
  const boxW = measured.width + 40 * s;
  const boxH = 40 * s;
  const boxX = width / 2 - boxW / 2;
  const boxY = height * 0.85;

  drawGlassPill(ctx, boxX, boxY, boxW, boxH, "rgba(255,255,255,0.2)");

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fullText, width / 2, boxY + boxH / 2);
}

// 원형 프로그레스 링 카운트다운
export function drawCountdown(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seconds: number,
  totalSeconds: number,
) {
  const s = getScale(width);
  const cx = width / 2;
  const cy = height * GUIDE_CY_RATIO + (width * GUIDE_RY_RATIO) * 0.45;
  const outerR = 40 * s;
  const ringWidth = 4 * s;
  const progress = 1 - seconds / totalSeconds;

  ctx.save();

  // 반투명 원형 배경 (글래스)
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // 트랙 링 (배경)
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - ringWidth, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = ringWidth;
  ctx.stroke();

  // 프로그레스 링
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + progress * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - ringWidth, startAngle, endAngle);
  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = ringWidth;
  ctx.lineCap = "round";
  ctx.shadowColor = "#22C55E";
  ctx.shadowBlur = 8 * s;
  ctx.stroke();

  // 숫자
  ctx.shadowBlur = 0;
  ctx.font = `bold ${28 * s}px -apple-system, 'SF Pro Display', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(Math.ceil(seconds).toString(), cx, cy);

  ctx.restore();
}
