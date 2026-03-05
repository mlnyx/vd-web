/**
 * 프레임 간 비율 안정화를 위한 링 버퍼 (중앙값 반환)
 */

export interface RatioBufferResult {
  medianRatio: number;
  isStable: boolean;
  sampleCount: number;
}

export function createRatioBuffer(capacity = 10) {
  const buffer: number[] = [];

  return {
    push(ratio: number) {
      if (buffer.length >= capacity) {
        buffer.shift();
      }
      buffer.push(ratio);
    },

    getResult(): RatioBufferResult {
      if (buffer.length === 0) {
        return { medianRatio: 0, isStable: false, sampleCount: 0 };
      }

      const sorted = [...buffer].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const medianRatio =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];

      return {
        medianRatio,
        isStable: buffer.length >= 5,
        sampleCount: buffer.length,
      };
    },

    clear() {
      buffer.length = 0;
    },
  };
}
