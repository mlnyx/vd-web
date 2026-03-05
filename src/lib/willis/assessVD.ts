import type { VDVerdict } from "../store/assessmentStore";

// Willis 비율 정상 범위 (논문 기준 1:1 ± 15%)
export const WILLIS_RANGE_MIN = 0.85;
export const WILLIS_RANGE_MAX = 1.15;

// 하위 호환용 (기존 코드 참조)
export const WILLIS_THRESHOLD = WILLIS_RANGE_MIN;

/**
 * 정상 범위 판정 유틸
 * 0.9 ≤ ratio ≤ 1.5 → 정상
 */
export function isNormalRange(ratio: number): boolean {
  return ratio >= WILLIS_RANGE_MIN && ratio <= WILLIS_RANGE_MAX;
}

/**
 * VD 판정
 * 0.9 ≤ Willis 비율 ≤ 1.5 → NORMAL
 * 그 외 → LOWER
 */
export function assessVD(willisRatio: number): VDVerdict {
  return isNormalRange(willisRatio) ? "NORMAL" : "LOWER";
}

/**
 * VD 판정 상세 결과
 */
export interface VDAssessmentResult {
  ratio: number;
  verdict: VDVerdict;
  threshold: number;
  deviation: number;
  message: string;
}

export function getDetailedAssessment(willisRatio: number): VDAssessmentResult {
  const verdict = assessVD(willisRatio);

  // 편차: 가장 가까운 경계까지의 거리
  let deviation: number;
  if (willisRatio < WILLIS_RANGE_MIN) {
    deviation = willisRatio - WILLIS_RANGE_MIN;
  } else if (willisRatio > WILLIS_RANGE_MAX) {
    deviation = willisRatio - WILLIS_RANGE_MAX;
  } else {
    // 정상 범위 내 → 범위 중간값 대비 편차
    const mid = (WILLIS_RANGE_MIN + WILLIS_RANGE_MAX) / 2;
    deviation = willisRatio - mid;
  }

  let message: string;
  if (verdict === "NORMAL") {
    if (willisRatio < WILLIS_RANGE_MIN + 0.05 || willisRatio > WILLIS_RANGE_MAX - 0.05) {
      message = "정상 범위 (경계 근처)";
    } else {
      message = "정상 범위 (VD 충분)";
    }
  } else {
    if (willisRatio < WILLIS_RANGE_MIN) {
      if (deviation < -0.05) {
        message = "VD 부족 (교합 높이 회복 권장)";
      } else {
        message = "경미한 VD 부족 (경계 근처)";
      }
    } else {
      if (deviation > 0.05) {
        message = "VD 과다 (교합 높이 감소 권장)";
      } else {
        message = "경미한 VD 과다 (경계 근처)";
      }
    }
  }

  return {
    ratio: willisRatio,
    verdict,
    threshold: WILLIS_RANGE_MIN,
    deviation,
    message,
  };
}
