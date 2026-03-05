import type { VDVerdict } from "../store/assessmentStore";

interface ShareData {
  imageBase64: string; // data:image/jpeg;base64,... 형태
  ratio: number;
  verdict: VDVerdict;
  patientName?: string;
  date?: Date;
}

// base64 data URL → Blob 변환
function base64ToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const byteStr = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteStr.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteStr.length; i++) {
    uint8Array[i] = byteStr.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mime });
}

/**
 * VD 평가 결과를 Web Share API로 공유
 * 미지원 브라우저에서는 이미지 다운로드 폴백
 */
export async function shareResult(data: ShareData): Promise<boolean> {
  const blob = base64ToBlob(data.imageBase64);
  const file = new File([blob], `vd_result_${Date.now()}.jpg`, {
    type: "image/jpeg",
  });

  const text = `VD 평가 결과\nWillis 비율: ${data.ratio.toFixed(3)}\n판정: ${data.verdict}${
    data.patientName ? `\n환자: ${data.patientName}` : ""
  }`;

  // Web Share API 시도
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: "VD 평가 결과",
        text,
        files: [file],
      });
      return true;
    } catch (err) {
      // 사용자 취소
      if (err instanceof Error && err.name === "AbortError") {
        return true;
      }
    }
  }

  // 폴백: 이미지 다운로드
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vd_result_${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return false;
}
